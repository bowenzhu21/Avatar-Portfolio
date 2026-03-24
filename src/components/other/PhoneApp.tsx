"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { HeyGenAvatarClient, type HeyGenAvatarState } from "@/lib/heygen";
import { phoneContacts } from "@/data/chatContacts";
import type { ChatContact, ChatContactId } from "@/types";

type PhoneTab = "favorites" | "recents" | "contacts";
type CallMode = "call" | "facetime";

interface PhoneAppProps {
  onOpenMessages: (contactId: ChatContactId) => void;
}

const recents = [
  { id: "recent-lara-out", contactId: "lara" as const, direction: "outgoing", label: "mobile", time: "Yesterday" },
  { id: "recent-john-missed", contactId: "john" as const, direction: "missed", label: "mobile", time: "Mon" },
  { id: "recent-lara-in", contactId: "lara" as const, direction: "incoming", label: "FaceTime Audio", time: "Sun" },
];

const INITIAL_DEBUG: HeyGenAvatarState["debug"] = {
  roomState: "disconnected",
  remoteParticipantIdentity: null,
  hasRemoteParticipant: false,
  remoteAudioSubscribed: false,
  remoteVideoSubscribed: false,
  remoteAudioTrackCount: 0,
  remoteVideoTrackCount: 0,
  audioElementAttached: false,
  audioPlaybackBlocked: false,
  audioPlaybackStarted: false,
};

const INITIAL_AVATAR_STATE: HeyGenAvatarState = {
  status: "idle",
  isLoading: false,
  isConnected: false,
  isSpeaking: false,
  videoStream: null,
  audioStream: null,
  session: null,
  connectionQuality: "unknown",
  error: null,
  debug: INITIAL_DEBUG,
};

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
            {activeTab === "recents" ? <RecentsScreen onOpenContact={openContact} onOpenCall={openCall} /> : null}
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
    recents: "Recents",
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

function RecentsScreen({
  onOpenContact,
  onOpenCall,
}: {
  onOpenContact: (contactId: ChatContactId) => void;
  onOpenCall: (contactId: ChatContactId, mode: CallMode) => void;
}) {
  return (
    <div className="px-4 pb-6 pt-2">
      {recents.map((entry) => {
        const contact = phoneContacts.find((item) => item.id === entry.contactId) ?? phoneContacts[0];
        const missed = entry.direction === "missed";

        return (
          <div key={entry.id} className="flex items-center gap-3 border-b border-black/6 py-3">
            <button type="button" onClick={() => onOpenContact(contact.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#e8ebf0]">
                <Image src={contact.avatar} alt={contact.name} fill sizes="44px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[0.92rem] font-medium ${missed ? "text-[#d13939]" : "text-[#171717]"}`}>{contact.name}</p>
                <p className="mt-0.5 text-[0.76rem] text-[#8b8b92]">{entry.label}</p>
              </div>
              <p className="shrink-0 text-[0.74rem] text-[#8b8b92]">{entry.time}</p>
            </button>
            <button
              type="button"
              onClick={() => onOpenCall(contact.id, entry.label.toLowerCase().includes("face") ? "facetime" : "call")}
              className="text-[0.86rem] font-medium text-[#007aff]"
            >
              Call
            </button>
          </div>
        );
      })}
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
          <DetailAction label="message" iconSrc="/phone/message.png" onClick={onMessage} />
          <DetailAction label="call" iconSrc="/phone/call.png" onClick={onCall} />
          <DetailAction label="FaceTime" iconSrc="/phone/facetime.png" onClick={onFaceTime} />
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
  onClick,
}: {
  label: string;
  iconSrc: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="rounded-[1.25rem] bg-white px-3 py-3 text-center shadow-[0_6px_16px_rgba(0,0,0,0.05)]">
      <div className="relative mx-auto h-6 w-6">
        <Image src={iconSrc} alt={label} fill sizes="24px" className="object-contain" />
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
  const {
    videoRef,
    audioRef,
    state,
    createAndStartSession,
    stopSession,
  } = usePhoneAvatar(contact.heygenAvatarId ?? null);

  useEffect(() => {
    if (!contact.heygenAvatarId) {
      return;
    }

    void createAndStartSession({ avatarId: contact.heygenAvatarId }).catch(() => {});

    return () => {
      void stopSession();
    };
  }, [contact.heygenAvatarId, createAndStartSession, stopSession]);

  const statusLabel =
    state.status === "connected" || state.status === "speaking"
      ? mode === "facetime"
        ? "Connected"
        : "On call"
      : state.status === "error"
        ? "Connection failed"
        : mode === "facetime"
          ? "Connecting FaceTime..."
          : "Calling...";

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#0e131b,#04070d)] text-white">
      <audio ref={audioRef} className="hidden" playsInline />
      <div className="absolute inset-0">
        {state.videoStream ? (
          <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
        ) : (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.56)),url("${contact.avatar}")` }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_26%)]" />
          </>
        )}
      </div>

      <div className="relative z-10 flex h-full flex-col px-5 pb-8 pt-12">
        <div className="text-center">
          <p className="text-[0.8rem] uppercase tracking-[0.26em] text-white/56">
            {mode === "facetime" ? "FaceTime" : "Phone"}
          </p>
          <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em]">{contact.name}</h1>
          <p className="mt-2 text-[0.84rem] text-white/72">{statusLabel}</p>
        </div>

        {process.env.NODE_ENV === "development" ? (
          <div className="mt-5 self-center rounded-full border border-white/14 bg-white/10 px-3 py-1 text-[0.68rem] text-white/72 backdrop-blur-xl">
            {state.debug.roomState} · audio {state.debug.remoteAudioSubscribed ? "on" : "off"} · video {state.debug.remoteVideoSubscribed ? "on" : "off"}
          </div>
        ) : null}

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
              void stopSession();
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
    { id: "recents", label: "Recents", icon: "🕘" },
    { id: "contacts", label: "Contacts", icon: "👤" },
  ];

  return (
    <div className="border-t border-black/6 bg-[rgba(248,248,250,0.96)] px-2 pb-2 pt-1 backdrop-blur-xl">
      <div className="grid grid-cols-5">
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

function usePhoneAvatar(avatarId: string | null) {
  const clientRef = useRef<HeyGenAvatarClient | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<HeyGenAvatarState>(INITIAL_AVATAR_STATE);

  if (!clientRef.current) {
    clientRef.current = new HeyGenAvatarClient();
  }

  useEffect(() => {
    const client = clientRef.current!;
    return client.subscribe(setState);
  }, []);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) {
      return;
    }

    element.muted = true;

    if (!state.videoStream) {
      element.srcObject = null;
      return;
    }

    element.srcObject = state.videoStream;
    void element.play().catch(() => {});
  }, [state.videoStream]);

  useEffect(() => {
    const client = clientRef.current!;
    const element = audioRef.current;
    client.markAudioElementAttached(Boolean(element));

    if (!element) {
      return;
    }

    if (!state.audioStream) {
      element.srcObject = null;
      client.markAudioPlaybackStatus("cleared");
      return;
    }

    element.srcObject = state.audioStream;
    element.muted = false;
    element.autoplay = true;
    void element.play().then(
      () => client.markAudioPlaybackStatus("started"),
      () => client.markAudioPlaybackStatus("blocked"),
    );
  }, [state.audioStream]);

  const api = useMemo(() => {
    const client = clientRef.current!;

    return {
      createAndStartSession: (options?: { avatarId?: string }) =>
        client.createAndStartSession({
          interactivityType: "CONVERSATIONAL",
          avatarId: options?.avatarId ?? avatarId ?? undefined,
        }),
      stopSession: () => client.stopSession(),
    };
  }, [avatarId]);

  return {
    videoRef,
    audioRef,
    state,
    ...api,
  };
}
