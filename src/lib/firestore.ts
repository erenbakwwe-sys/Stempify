import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  increment,
  query,
  where,
  serverTimestamp,
  addDoc,
  Timestamp,
} from "firebase/firestore";

// ============================================================
// TYPES
// ============================================================

export interface StampifyUser {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  birthdate?: string;
  referralCode: string;
  referredBy?: string; // referral code of the person who invited them
  referralRewardClaimed?: boolean; // has the inviter been rewarded?
  createdAt?: Timestamp;
}

export interface StampifyBusiness {
  id?: string;
  name: string;
  ownerEmail: string;
  staffPin: string; // PIN for cashier approval
  requiredStamps: number; // how many stamps for a free reward
  location?: { lat: number; lng: number };
}

export interface StampRecord {
  id?: string;
  userId: string;
  businessId: string;
  count: number;
  freeCoffeesAvailable: number;
  lastUpdated?: Timestamp;
}

export interface TransactionLog {
  userId: string;
  businessId: string;
  type: "stamp_earned" | "reward_claimed" | "referral_bonus";
  createdAt?: Timestamp;
}

// ============================================================
// USERS
// ============================================================

/**
 * Register a new user. Generates a unique 6-char referral code.
 */
export async function registerUser(data: {
  name: string;
  phone: string;
  email?: string;
  birthdate?: string;
  referredBy?: string;
}): Promise<string> {
  const referralCode = generateReferralCode(data.name);
  const userRef = doc(collection(db, "users"));
  const userData: StampifyUser = {
    name: data.name,
    phone: data.phone,
    email: data.email || "",
    birthdate: data.birthdate || "",
    referralCode,
    referredBy: data.referredBy || "",
    referralRewardClaimed: false,
    createdAt: serverTimestamp() as Timestamp,
  };
  await setDoc(userRef, userData);
  return userRef.id;
}

/**
 * Get user by phone number
 */
export async function getUserByPhone(phone: string): Promise<(StampifyUser & { id: string }) | null> {
  const q = query(collection(db, "users"), where("phone", "==", phone));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as StampifyUser & { id: string };
}

/**
 * Get user by referral code
 */
export async function getUserByReferralCode(code: string): Promise<(StampifyUser & { id: string }) | null> {
  const q = query(collection(db, "users"), where("referralCode", "==", code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as StampifyUser & { id: string };
}

/**
 * Get all users (for admin dashboard)
 */
export async function getAllUsers(): Promise<(StampifyUser & { id: string })[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as (StampifyUser & { id: string })[];
}

// ============================================================
// STAMPS
// ============================================================

/**
 * Add 1 stamp for a user at a business. Creates the stamp record if it doesn't exist.
 * Also handles referral reward logic (Anti-Fraud: only rewards after first real stamp).
 */
export async function addStamp(userId: string, businessId: string): Promise<{ newCount: number; rewardEarned: boolean }> {
  const stampDocId = `${userId}_${businessId}`;
  const stampRef = doc(db, "stamps", stampDocId);
  const stampSnap = await getDoc(stampRef);

  let newCount = 1;
  let rewardEarned = false;

  // Get business info for required stamps
  const businessRef = doc(db, "businesses", businessId);
  const businessSnap = await getDoc(businessRef);
  const requiredStamps = businessSnap.exists() ? (businessSnap.data() as StampifyBusiness).requiredStamps : 6;

  if (stampSnap.exists()) {
    const currentData = stampSnap.data() as StampRecord;
    newCount = currentData.count + 1;

    // Check if reward earned
    if (newCount >= requiredStamps) {
      newCount = 0; // Reset stamp card
      rewardEarned = true;
      await updateDoc(stampRef, {
        count: 0,
        freeCoffeesAvailable: increment(1),
        lastUpdated: serverTimestamp(),
      });
    } else {
      await updateDoc(stampRef, {
        count: increment(1),
        lastUpdated: serverTimestamp(),
      });
    }
  } else {
    // First stamp ever for this user+business
    await setDoc(stampRef, {
      userId,
      businessId,
      count: 1,
      freeCoffeesAvailable: 0,
      lastUpdated: serverTimestamp(),
    });
  }

  // Log transaction
  await addDoc(collection(db, "transactions"), {
    userId,
    businessId,
    type: rewardEarned ? "reward_claimed" : "stamp_earned",
    createdAt: serverTimestamp(),
  } as TransactionLog);

  // REFERRAL ANTI-FRAUD: Check if this is the user's very first stamp ever
  // If so, reward the person who invited them.
  const isFirstStampEver = !stampSnap.exists();
  if (isFirstStampEver) {
    await processReferralReward(userId, businessId);
  }

  return { newCount, rewardEarned };
}

/**
 * Get stamp record for a user at a specific business
 */
export async function getStampRecord(userId: string, businessId: string): Promise<StampRecord | null> {
  const stampDocId = `${userId}_${businessId}`;
  const stampRef = doc(db, "stamps", stampDocId);
  const snap = await getDoc(stampRef);
  if (!snap.exists()) return null;
  return snap.data() as StampRecord;
}

// ============================================================
// REFERRAL SYSTEM (ANTI-FRAUD)
// ============================================================

/**
 * When a new user earns their FIRST stamp, check if they were referred.
 * If yes, give +1 bonus stamp to the inviter. (Only once per referral)
 */
async function processReferralReward(newUserId: string, businessId: string) {
  const userRef = doc(db, "users", newUserId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const userData = userSnap.data() as StampifyUser;

  // No referral code? Skip.
  if (!userData.referredBy) return;
  // Already rewarded? Skip.
  if (userData.referralRewardClaimed) return;

  // Find the inviter by referral code
  const inviter = await getUserByReferralCode(userData.referredBy);
  if (!inviter) return;

  // Give the inviter +1 bonus stamp
  await addStamp(inviter.id, businessId);

  // Mark as claimed so it can't be exploited
  await updateDoc(userRef, { referralRewardClaimed: true });

  // Log referral transaction
  await addDoc(collection(db, "transactions"), {
    userId: inviter.id,
    businessId,
    type: "referral_bonus",
    createdAt: serverTimestamp(),
  } as TransactionLog);
}

// ============================================================
// BUSINESSES
// ============================================================

/**
 * Create or update a business profile
 */
export async function saveBusiness(id: string, data: Omit<StampifyBusiness, "id">) {
  await setDoc(doc(db, "businesses", id), data, { merge: true });
}

/**
 * Get business by ID
 */
export async function getBusiness(id: string): Promise<StampifyBusiness | null> {
  const snap = await getDoc(doc(db, "businesses", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as StampifyBusiness;
}

// ============================================================
// HELPERS
// ============================================================

function generateReferralCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase() || "USER";
  const suffix = Math.floor(100 + Math.random() * 900).toString();
  return `${prefix}${suffix}`;
}
