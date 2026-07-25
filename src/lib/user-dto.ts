export interface AuthenticatedUserPayload {
  id: string;
  fullName: string;
  name: string; // compatibility alias
  email: string;
  phoneNumber: string;
  phone: string; // compatibility alias
  role: "BUYER" | "FARMER" | "ADMIN";
  isActive: boolean;
  profileCompletion: number;
  missingFields: string[];
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  isVerified?: boolean;
  profileImage?: string;
  createdAt: string;
  buyerProfile?: {
    id: string;
    address: string | null;
    state: string | null;
    lga: string | null;
  } | null;
  farmerProfile?: {
    id: string;
    farmName: string;
    farmDescription: string | null;
    farmAddress: string;
    state: string;
    lga: string;
    verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  } | null;
}

export function formatAuthenticatedUser(user: {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "BUYER" | "FARMER" | "ADMIN";
  isActive: boolean;
  profileImage?: string | null;
  createdAt: Date;
  buyerProfile?: {
    id: string;
    address: string | null;
    state: string | null;
    lga: string | null;
  } | null;
  farmerProfile?: {
    id: string;
    farmName: string;
    farmDescription: string | null;
    farmAddress: string;
    state: string;
    lga: string;
    verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  } | null;
}): AuthenticatedUserPayload {
  const missingFields: string[] = [];
  let totalFields = 0;
  let completedFields = 0;

  // Basic user fields
  const checkField = (fieldName: string, val: string | null | undefined) => {
    totalFields++;
    if (val && val.trim() !== "") {
      completedFields++;
    } else {
      missingFields.push(fieldName);
    }
  };

  checkField("Full Name", user.fullName);
  checkField("Email", user.email);
  checkField("Phone Number", user.phoneNumber);

  let verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | undefined = undefined;
  let isVerified = false;

  if (user.role === "FARMER" && user.farmerProfile) {
    checkField("Farm Name", user.farmerProfile.farmName);
    checkField("Farm Address", user.farmerProfile.farmAddress);
    checkField("State", user.farmerProfile.state);
    checkField("LGA", user.farmerProfile.lga);
    verificationStatus = user.farmerProfile.verificationStatus;
    isVerified = user.farmerProfile.verificationStatus === "APPROVED";
  } else if (user.role === "BUYER" && user.buyerProfile) {
    checkField("Delivery Address", user.buyerProfile.address);
    checkField("State", user.buyerProfile.state);
    checkField("LGA", user.buyerProfile.lga);
  }

  const profileCompletion = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 100;

  return {
    id: user.id,
    fullName: user.fullName,
    name: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    phone: user.phoneNumber,
    role: user.role,
    isActive: user.isActive,
    profileImage: user.profileImage || undefined,
    profileCompletion,
    missingFields,
    verificationStatus,
    isVerified,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
    buyerProfile: user.buyerProfile
      ? {
          id: user.buyerProfile.id,
          address: user.buyerProfile.address,
          state: user.buyerProfile.state,
          lga: user.buyerProfile.lga,
        }
      : null,
    farmerProfile: user.farmerProfile
      ? {
          id: user.farmerProfile.id,
          farmName: user.farmerProfile.farmName,
          farmDescription: user.farmerProfile.farmDescription,
          farmAddress: user.farmerProfile.farmAddress,
          state: user.farmerProfile.state,
          lga: user.farmerProfile.lga,
          verificationStatus: user.farmerProfile.verificationStatus,
        }
      : null,
  };
}
