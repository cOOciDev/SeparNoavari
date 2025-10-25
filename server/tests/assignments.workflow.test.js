import { jest } from "@jest/globals";
import path from "path";
import bcrypt from "bcrypt";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

jest.setTimeout(40000);

describe("Evaluation workflow endpoints", () => {
  let mongo;
  let app;
  let adminAgent;
  let judgeAgent;
  let connectMongo;
  let initIndexes;
  let disconnectMongo;
  let Idea;
  let Judge;
  let Assignment;
  let User;
  let idea;
  let judgeUser;
  let judgeProfile;

  const adminCredentials = {
    email: "admin@test.local",
    password: "test-password",
  };

  const judgeCredentials = {
    email: "judge@test.local",
    password: "judge-password",
  };

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.SESSION_SECRET = "test-secret";
    process.env.CLIENT_ORIGIN = "http://localhost:5173";
    process.env.ADMIN_USERNAME = adminCredentials.email;
    process.env.ADMIN_PASSWORD = adminCredentials.password;
    process.env.LOG_LEVEL = "error";
    process.env.EVAL_MAX_FILE_MB = "30";
    process.env.ASSIGNMENT_ALLOW_PDF = "0";
    process.env.MAX_JUDGES_PER_IDEA = "10";

    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGO_URI = uri;

    ({ connectMongo, initIndexes, disconnectMongo } = await import(
      "../src/config/db.js"
    ));
    ({ default: Idea } = await import("../src/models/Idea.js"));
    ({ default: Judge } = await import("../src/models/Judge.js"));
    ({ default: Assignment } = await import("../src/models/Assignment.js"));
    ({ default: User } = await import("../src/models/User.js"));

    await connectMongo(uri);
    await initIndexes();

    const appModule = await import("../src/app.js");
    app = appModule.default;
    adminAgent = request.agent(app);
    judgeAgent = request.agent(app);
  });

  afterAll(async () => {
    await disconnectMongo();
    if (mongo) {
      await mongo.stop();
    }
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Assignment.deleteMany({});
    await Judge.deleteMany({});
    await Idea.deleteMany({});
    await User.deleteMany({});

    const adminUser = await User.create({
      email: adminCredentials.email,
      role: "ADMIN",
      passwordHash: await bcrypt.hash(adminCredentials.password, 10),
      name: "Admin",
    });

    const owner = await User.create({
      email: "owner@test.local",
      role: "USER",
      passwordHash: await bcrypt.hash("owner-password", 10),
      name: "Owner",
    });

    judgeUser = await User.create({
      email: judgeCredentials.email,
      role: "JUDGE",
      passwordHash: await bcrypt.hash(judgeCredentials.password, 10),
      name: "Judge One",
    });

    judgeProfile = await Judge.create({
      user: judgeUser._id,
      expertise: ["GENERAL"],
      active: true,
    });

    idea = await Idea.create({
      owner: owner._id,
      title: "Zero Waste Platform",
      summary: "A long description of the idea that exceeds fifty chars",
      category: "GENERAL",
      contactEmail: owner.email,
      submitterName: owner.name,
      files: [],
    });

    await adminAgent
      .post("/api/auth/login")
      .send(adminCredentials)
      .expect(200);

    await judgeAgent
      .post("/api/auth/login")
      .send(judgeCredentials)
      .expect(200);
  });

  const dummyDocx = path.resolve("dummy.docx");
  const dummyPdf = path.resolve("dummy.pdf");

  const createAssignment = async (judgeIds = [String(judgeProfile._id)]) => {
    const response = await adminAgent
      .post("/api/admin/assignments/manual")
      .send({
        ideaId: String(idea._id),
        judgeIds,
      });
    return response.body.assignments?.[0];
  };

  it("creates manual assignments and enforces MAX_JUDGES_PER_IDEA=10", async () => {
    const extraJudges = [];
    for (let i = 0; i < 10; i += 1) {
      const user = await User.create({
        email: `judge${i}@test.local`,
        role: "JUDGE",
        passwordHash: await bcrypt.hash("password", 10),
        name: `Judge ${i}`,
      });
      const judge = await Judge.create({
        user: user._id,
        expertise: [],
        active: true,
      });
      extraJudges.push(String(judge._id));
    }

    const success = await adminAgent
      .post("/api/admin/assignments/manual")
      .send({ ideaId: String(idea._id), judgeIds: extraJudges })
      .expect(201);
    expect(success.body.assignments).toHaveLength(10);

    const eleventhJudge = await User.create({
      email: "judge10@test.local",
      role: "JUDGE",
      passwordHash: await bcrypt.hash("password", 10),
      name: "Judge 10",
    });
    const judgeDoc = await Judge.create({
      user: eleventhJudge._id,
      expertise: [],
      active: true,
    });

    const conflict = await adminAgent
      .post("/api/admin/assignments/manual")
      .send({
        ideaId: String(idea._id),
        judgeIds: [String(judgeDoc._id)],
      })
      .expect(409);
    expect(conflict.body.code).toBe("MAX_JUDGES_PER_IDEA");
  });

  it("allows judge submission uploads, rejects PDF, and blocks after lock", async () => {
    const assignment = await createAssignment();
    const assignmentId = assignment.id;

    const upload = await judgeAgent
      .post(`/api/judge/assignments/${assignmentId}/submission`)
      .attach("file", dummyDocx)
      .expect(201);
    expect(upload.body.assignment.status).toBe("SUBMITTED");
    expect(upload.body.assignment.submission.filename).toMatch(/\.docx$/);

    await judgeAgent
      .post(`/api/judge/assignments/${assignmentId}/submission`)
      .attach("file", dummyPdf)
      .expect(400);

    await adminAgent
      .patch(`/api/admin/assignments/${assignmentId}/lock`)
      .expect(200);

    await judgeAgent
      .post(`/api/judge/assignments/${assignmentId}/submission`)
      .attach("file", dummyDocx)
      .expect(423);
  });

  it("stores and serves final summary documents", async () => {
    const upload = await adminAgent
      .post(`/api/admin/ideas/${idea._id}/final-summary`)
      .attach("file", dummyDocx)
      .expect(201);

    expect(upload.body.summary.filename).toMatch(/summary\.docx$/);

    const meta = await adminAgent
      .get(`/api/admin/ideas/${idea._id}/final-summary`)
      .expect(200);
    expect(meta.body.summary.downloadUrl).toContain("/final-summary/file");

    await adminAgent
      .get(`/api/admin/ideas/${idea._id}/final-summary/file`)
      .expect(200)
      .expect("Content-Type", /application\/vnd/);
  });

  it("builds archive of submissions for an idea", async () => {
    const assignment = await createAssignment();
    const assignmentId = assignment.id;

    await judgeAgent
      .post(`/api/judge/assignments/${assignmentId}/submission`)
      .attach("file", dummyDocx)
      .expect(201);

    const archive = await adminAgent
      .get(`/api/admin/ideas/${idea._id}/submissions/archive`)
      .expect(200);
    expect(archive.headers["content-type"]).toBe("application/zip");
  });
});
