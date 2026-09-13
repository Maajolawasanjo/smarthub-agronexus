"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

// WhatsApp icon as SVG
function WhatsAppIcon({ size = 20 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className="text-green-500"
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
    );
}

interface FieldAgentProps {
    profileCompletion?: {
        percentage: number;
        completedFields: string[];
        missingFields: string[];
        recommendedNextAction: string;
    };
}

export function FieldAgent({ profileCompletion }: FieldAgentProps) {
    const percentage = profileCompletion?.percentage ?? 100;
    const hasPendingFields = (profileCompletion?.missingFields?.length ?? 0) > 0;

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
            {/* Top: Field Support Desk */}
            <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">
                    Field Agent & Agronomy Support
                </p>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-green-100 flex-shrink-0">
                            <Image
                                src="/avatar-3.png"
                                alt="Ade Olayinka"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Ade Olayinka</p>
                            <p className="text-xs text-gray-400">Assigned Agro-Hub Agent</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href="tel:+2348105510626"
                            className="w-9 h-9 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="Call field agent"
                            title="Call Agent"
                        >
                            <Phone size={16} className="text-green-600" />
                        </a>
                        <a
                            href="https://wa.me/2348105510626?text=Hello%20SmartHub%20AgroChain,%20I%20need%20assistance%20with%20my%20farmer%20account"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors cursor-pointer"
                            aria-label="WhatsApp field agent"
                            title="WhatsApp Support"
                        >
                            <WhatsAppIcon size={16} />
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom: Profile & KYC Verification Readiness */}
            {profileCompletion && (
                <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-gray-700 flex items-center gap-1">
                            <ShieldCheck size={14} className="text-[#1B4D28]" />
                            Profile Readiness
                        </span>
                        <span className="font-bold text-[#1B4D28]">{percentage}%</span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
                        <div
                            className="bg-[#1B4D28] h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>

                    {hasPendingFields ? (
                        <div className="flex items-center justify-between gap-2 mt-2">
                            <span className="text-[11px] text-gray-500 truncate">
                                Next: {profileCompletion.recommendedNextAction}
                            </span>
                            <Link
                                href="/farmer/kyc"
                                className="text-[11px] font-bold text-[#1B4D28] hover:underline flex items-center gap-0.5 shrink-0"
                            >
                                Complete <ArrowRight size={11} />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-1">
                            <CheckCircle2 size={12} />
                            Producer profile verified and active for bulk trade
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
