import { describe, it, expect, beforeAll, afterAll } from "vitest";
import buildApp from "../app.js";
import { FastifyInstance } from "fastify";

describe("App Ultimate E2E: Full Business Lifecycle", () => {
  let app: FastifyInstance;

  // Real-time state captured during the test
  let jwtToken: string;
  let categoryId: string;
  let productId: string;
  let addressId: string;

  const testUser = {
    phone: "7886474987",
    name: "Engineering Test User",
    bio: "Automated System Test",
  };

  beforeAll(async () => {
    app = await buildApp();
  });

  // --- PHASE 1: AUTHENTICATION (The "Real" Chain) ---

  it("1. Request OTP - Should trigger DB entry", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/request-otp",
      payload: { phoneNumber: testUser.phone },
    });
    expect(res.statusCode).toBe(200);
  });

  it("2. Verify OTP - Should fetch code from DB and return JWT", async () => {
    // We reach into Supabase to get the ACTUAL code generated in Step 1
    const { data: otpRow } = await app.supabase
      .from("otps")
      .select("code")
      .eq("identifier", testUser.phone)
      .single();

    expect(otpRow?.code).toBeDefined();

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/verify-otp",
      payload: { phoneNumber: testUser.phone, code: otpRow!.code },
    });

    const body = JSON.parse(res.payload);
    expect(res.statusCode).toBe(200);
    expect(body.data.token).toBeDefined();
    jwtToken = body.data.token; // Save token for all following protected routes
  });

  // --- PHASE 2: USER SETUP ---

  it("3. Profile Setup - Update name and become a Seller", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/api/v1/users/me",
      headers: { authorization: `Bearer ${jwtToken}` },
      payload: {
        full_name: testUser.name,
        bio: testUser.bio,
        is_seller: true,
      },
    });

    const body = JSON.parse(res.payload);
    expect(res.statusCode).toBe(200);
    expect(body.data.is_seller).toBe(true);
  });

  it("4. Address Creation - Link a physical location to the account", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/addresses",
      headers: { authorization: `Bearer ${jwtToken}` },
      payload: {
        governorate: "Babylon",
        city_district: "Hillah",
        street_address: "Engineer's District",
        nearest_landmark: "University of Babylon",
        is_default: true,
      },
    });

    const body = JSON.parse(res.payload);
    expect(res.statusCode).toBe(201);
    addressId = body.data.id;
  });

  // --- PHASE 3: MARKETPLACE FLOW ---

  it("5. Category Discovery - Fetch real ID from DB", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/categories" });
    const body = JSON.parse(res.payload);
    expect(body.data.length).toBeGreaterThan(0);
    categoryId = body.data[0].id; // Pulling a real, existing category ID
  });

  it("6. Product Creation - Post a listing using Category and JWT ID", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/products",
      headers: { authorization: `Bearer ${jwtToken}` },
      payload: {
        category_id: categoryId,
        title: "E2E Test Engine Part",
        description: "Testing system-wide integration for 'app'.",
        price_iqd: 125000,
        main_image: "https://ik.imagekit.io/app-images/test-part.jpg",
      },
    });

    const body = JSON.parse(res.payload);
    expect(res.statusCode).toBe(201);
    productId = body.data.id;
  });

  // --- PHASE 4: SOCIAL & RETRIEVAL ---

  it("7. Product Interaction - Post a public comment", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/interactions",
      headers: { authorization: `Bearer ${jwtToken}` },
      payload: {
        product_id: productId,
        message: "Is this part compatible with 2024 Toyota models?",
      },
    });

    const body = JSON.parse(res.payload);
    expect(res.statusCode).toBe(201);
  });

  it("8. Full Discovery - Get Product with Seller and Address Details", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/v1/products/${productId}`,
    });

    const body = JSON.parse(res.payload);
    expect(res.statusCode).toBe(200);
    // Verify the deep join: Product -> Seller -> Address
    expect(body.data.seller.full_name).toBe(testUser.name);
    expect(body.data.seller.address[0].governorate).toBe("Babylon");
  });

  // --- CLEANUP ---

  afterAll(async () => {
    // Delete the test user; Postgres cascades will clean up products, addresses, and comments
    await app.supabase
      .from("accounts")
      .delete()
      .eq("phone_number", testUser.phone);
  });
});
