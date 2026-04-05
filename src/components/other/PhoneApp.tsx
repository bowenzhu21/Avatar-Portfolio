"use client";

import Image from "next/image";
import { useState } from "react";
import { phoneContacts } from "@/data/chatContacts";
import type { ChatContact, ChatContactId } from "@/types";

type PhoneTab = "favorites" | "contacts";
type CallMode = "call" | "facetime";

interface PhoneAppProps {
  onOpenMessages: (contactId: ChatContactId) => void;
}

export function PhoneApp({ onOpenMessages }: PhoneAppProps) {
  const [activeTab, setActiveTab] = useState<PhoneTab>("favorites");
  const [selectedContactId, setSelectedContactId] = useState<ChatContactId | null>(null);
  const [activeCall, setActiveCall] = useState<{ contactId: ChatContactId; mode: CallMode } | null>(null);
  const contact = selectedContactId
    ? phoneContacts.find((entry) => entry.id === selectedContactId) ?? null
    : null;

  function openContact(contactId: ChatContactId) {
    setSelectedContactId(contactId);
    setActiveCall(null);
  }

  function openCall(contactId: ChatContactId, mode: CallMode) {
    setSelectedContactId(contactId);
    setActiveCall({ contactId, mode });
  }

  function closeDetail() {
    setSelectedContactId(null);
    setActiveCall(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f7f9] text-[#111111]">
      {activeCall ? (
        <PhoneCallScreen
          contact={phoneContacts.find((entry) => entry.id === activeCall.contactId) ?? phoneContacts[0]}
          mode={activeCall.mode}
          onHangUp={closeDetail}
        />
      ) : selectedContactId && contact ? (
        <ContactDetailScreen
          contact={contact}
          onBack={closeDetail}
          onCall={() => openCall(contact.id, "call")}
          onFaceTime={() => openCall(contact.id, "facetime")}
          onMessage={() => onOpenMessages(contact.id)}
        />
      ) : (
        <>
          <PhoneHeader activeTab={activeTab} />
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#ffffff]">
            {activeTab === "favorites" ? <FavoritesScreen onOpenContact={openContact} /> : null}
            {activeTab === "contacts" ? <ContactsScreen onOpenContact={openContact} /> : null}
          </div>
          <PhoneTabBar activeTab={activeTab} onChange={setActiveTab} />
        </>
      )}
    </div>
  );
}

function PhoneHeader({ activeTab }: { activeTab: PhoneTab }) {
  const titleMap: Record<PhoneTab, string> = {
    favorites: "Favorites",
    contacts: "Contacts",
  };

  return (
    <div className="border-b border-black/6 bg-[rgba(248,248,250,0.94)] px-4 pb-3 pt-4 backdrop-blur-xl">
      <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-[#111111]">{titleMap[activeTab]}</h1>
    </div>
  );
}

function FavoritesScreen({ onOpenContact }: { onOpenContact: (contactId: ChatContactId) => void }) {
  return (
    <div className="px-4 pb-6 pt-4">
      <div className="grid grid-cols-2 gap-5">
        {phoneContacts.map((contact) => (
          <button key={contact.id} type="button" onClick={() => onOpenContact(contact.id)} className="text-center">
            <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-[#e8ebf0] shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
              <Image src={contact.avatar} alt={contact.name} fill sizes="80px" className="object-cover" />
            </div>
            <p className="mt-3 text-[0.92rem] font-medium text-[#141414]">{contact.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ContactsScreen({ onOpenContact }: { onOpenContact: (contactId: ChatContactId) => void }) {
  return (
    <div className="px-4 pb-6 pt-3">
      <div className="rounded-[1rem] bg-[#eef0f4] px-3 py-2 text-[0.82rem] text-[#8b8b92]">Search</div>
      <div className="mt-4">
        {phoneContacts.map((contact) => (
          <button
            key={contact.id}
            type="button"
            onClick={() => onOpenContact(contact.id)}
            className="flex w-full items-center justify-between border-b border-black/6 py-3 text-left"
          >
            <span className="text-[0.92rem] font-medium text-[#171717]">{contact.name}</span>
            <span className="text-[1.1rem] text-[#c2c2c8]">&#8250;</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ContactDetailScreen({
  contact,
  onBack,
  onCall,
  onFaceTime,
  onMessage,
}: {
  contact: ChatContact;
  onBack: () => void;
  onCall: () => void;
  onFaceTime: () => void;
  onMessage: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f7f7f9]">
      <div className="border-b border-black/6 bg-[rgba(248,248,250,0.96)] px-3 pb-3 pt-3 backdrop-blur-xl">
        <button type="button" onClick={onBack} className="text-[1rem] font-medium text-[#007aff]">
          &#8249; Contacts
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative h-[7.5rem] w-[7.5rem] overflow-hidden rounded-full bg-[#e8ebf0] shadow-[0_12px_26px_rgba(0,0,0,0.08)]">
            <Image src={contact.avatar} alt={contact.name} fill sizes="120px" className="object-cover" />
          </div>
          <h1 className="mt-4 text-[2rem] font-semibold tracking-[-0.05em] text-[#111111]">{contact.name}</h1>
          <p className="mt-1 text-[0.82rem] text-[#7f7f87]">AI Contact</p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <DetailAction label="message" iconSrc="/phone/message.png" iconClassName="scale-[1]" onClick={onMessage} />
          <DetailAction label="call" iconSrc="/phone/call.png" iconClassName="scale-[0.88]" onClick={onCall} />
          <DetailAction label="FaceTime" iconSrc="/phone/facetime.png" iconClassName="scale-[1.14]" onClick={onFaceTime} />
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.4rem] bg-white">
          <div className="flex items-center justify-between border-b border-black/6 px-4 py-3">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#8b8b92]">{contact.phoneLabel}</p>
              <p className="mt-1 text-[0.94rem] font-medium text-[#171717]">{contact.phoneNumber}</p>
            </div>
            <button type="button" onClick={onCall} className="text-[0.88rem] font-medium text-[#007aff]">
              call
            </button>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[#8b8b92]">video</p>
              <p className="mt-1 text-[0.94rem] font-medium text-[#171717]">FaceTime</p>
            </div>
            <button type="button" onClick={onFaceTime} className="text-[0.88rem] font-medium text-[#007aff]">
              video
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailAction({
  label,
  iconSrc,
  iconClassName,
  onClick,
}: {
  label: string;
  iconSrc: string;
  iconClassName?: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="rounded-[1.25rem] bg-white px-3 py-3 text-center shadow-[0_6px_16px_rgba(0,0,0,0.05)]">
      <div className="relative mx-auto h-6 w-6">
        <Image src={iconSrc} alt={label} fill sizes="24px" className={`object-contain ${iconClassName ?? ""}`} />
      </div>
      <div className="mt-2 text-[0.74rem] font-medium text-[#007aff]">{label}</div>
    </button>
  );
}

function PhoneCallScreen({
  contact,
  mode,
  onHangUp,
}: {
  contact: ChatContact;
  mode: CallMode;
  onHangUp: () => void;
}) {
  const statusLabel = mode === "facetime" ? "FaceTime connected" : "On call";

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#0e131b,#04070d)] text-white">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.56)),url("${contact.avatar}")` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_26%)]" />
      </div>

      <div className="relative z-10 flex h-full flex-col px-5 pb-8 pt-12">
        <div className="text-center">
          <p className="text-[0.8rem] uppercase tracking-[0.26em] text-white/56">
            {mode === "facetime" ? "FaceTime" : "Phone"}
          </p>
          <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em]">{contact.name}</h1>
          <p className="mt-2 text-[0.84rem] text-white/72">{statusLabel}</p>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="relative flex h-[10rem] w-[10rem] items-center justify-center">
            {[0, 1, 2].map((ring) => (
              <div
                key={ring}
                className="absolute inset-0 animate-pulse rounded-full border border-white/18"
                style={{ animationDelay: `${ring * 220}ms` }}
              />
            ))}
            <div className="relative h-[7.75rem] w-[7.75rem] overflow-hidden rounded-full border border-white/16">
              <Image
                src={contact.avatar}
                alt={contact.name}
                fill
                sizes="124px"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <div className="mx-auto grid max-w-[16rem] grid-cols-3 gap-4 pb-6">
            {["mute", "speaker", mode === "facetime" ? "camera" : "add"].map((label) => (
              <div key={label} className="flex flex-col items-center">
                <div className="flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full bg-white/16 text-[0.82rem] font-medium backdrop-blur-xl">
                  {label}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              onHangUp();
            }}
            className="mx-auto flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-[#ff3b30] text-[1.5rem] shadow-[0_18px_30px_rgba(255,59,48,0.3)]"
            aria-label="Hang up"
          >
            ⏹
          </button>
        </div>
      </div>
    </div>
  );
}

function PhoneTabBar({
  activeTab,
  onChange,
}: {
  activeTab: PhoneTab;
  onChange: (tab: PhoneTab) => void;
}) {
  const tabs: Array<{ id: PhoneTab; label: string; icon: string }> = [
    { id: "favorites", label: "Favorites", icon: "★" },
    { id: "contacts", label: "Contacts", icon: "👤" },
  ];

  return (
    <div className="border-t border-black/6 bg-[rgba(248,248,250,0.96)] px-2 pb-2 pt-1 backdrop-blur-xl">
      <div className="mx-auto grid max-w-[13.5rem] grid-cols-2">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button key={tab.id} type="button" onClick={() => onChange(tab.id)} className="flex flex-col items-center gap-0.5 py-1">
              <span className={`text-[0.95rem] ${active ? "text-[#007aff]" : "text-[#8b8b92]"}`}>{tab.icon}</span>
              <span className={`text-[0.64rem] ${active ? "font-medium text-[#007aff]" : "text-[#8b8b92]"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
