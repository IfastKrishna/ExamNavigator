import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual, checkPrimeSync } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, UserRole } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "examportal-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 2, // 2 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
    // Force the session identifier cookie to be set on every response
    rolling: true,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, name, role } = req.body;

      // Basic validation
      if (!username || !password || !email || !name) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Determine role - default to STUDENT if not specified
      let userRole = role || UserRole.STUDENT;

      // Allow SUPER_ADMIN role to be explicitly set (for user registration)
      if (role === UserRole.SUPER_ADMIN) {
        userRole = UserRole.SUPER_ADMIN;
      }

      // Allow ACADEMY role either when:
      // 1. A super admin is creating the account, or
      // 2. The role is explicitly requested as ACADEMY
      if (role === UserRole.ACADEMY) {
        userRole = UserRole.ACADEMY;
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        name,
        role: userRole,
      });

      // // If creating an academy, also create an academy record
      // if (userRole === UserRole.ACADEMY) {
      //   await storage.createAcademy({
      //     userId: user.id,
      //     name: name,
      //     description: "",
      //     logoUrl: "",
      //     status: "ACTIVE",
      //   });
      // }

      // Remove password from response
      const { password: _, ...safeUser } = user;

      res.status(201).json(safeUser);

      // req.login(user, (err) => {
      //   if (err) return next(err);
      //   res.status(201).json(safeUser);
      // });
    } catch (error) {
      // next(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Remove password from response
    console.log("User logged in:", req.user);
    const { password: _, ...safeUser } = req.user as SelectUser;
    console.log("User logged in:", safeUser);
    res.status(200).json(safeUser);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Remove password from response
    const { password: _, ...safeUser } = req.user as SelectUser;
    res.json(safeUser);
  });
}
