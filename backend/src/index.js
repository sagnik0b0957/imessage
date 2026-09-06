//const express = require('express');
import express from "express";
import cors from "cors"; // cors(cross-origin resource sharing) is a mechanism that allows restricted resources on a web page to be requested from another domain outside the domain from which the resource originated.


import dotenv from "dotenv/config";

import fs from "fs";
import path from "path";

import { clerkMiddleware } from "@clerk/express";

import User from "./models/user.model.js";
import { connectDB } from "./lib/db.js";
import job from "./lib/cron.js";
import clerkWebhook from "./webhooks/clerk.webhook.js";

import dns from "dns";
dns.setServers(["8.8.8.8"]);

const app = express();

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL;

const publicDir = path.join(process.cwd(), "public");

//it is important that you don't parse the webhook event data, it should be in raw format
app.use("/api/webhooks/clerk", express.raw({type: "application/json"}), clerkWebhook);

app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true, // Allow credentials (cookies, authorization headers, etc.) to be sent in cross-origin requests
  }),
);

app.use(clerkMiddleware());

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

//if the public directory does not exist, serve static files from the public directory
//this is for production build, when the frontend is built and served from the backend
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("/{*any}", (req, res, next) => {  
    res.sendFile(path.join(publicDir,"index.html"), (err) => next(err));
  });
}


app.listen(PORT, () => {
  connectDB();
  console.log("Server is running on port", PORT);

  if(process.env.NODE_ENV=== "production") {
    job.start();
  }
});

