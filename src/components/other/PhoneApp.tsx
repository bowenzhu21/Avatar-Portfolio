"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { phoneContacts } from "@/data/chatContacts";
import {
  type DeepgramRealtimeState,
  DeepgramRealtimeClient,
} from "@/lib/deepgram";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import type {
  ChatContact,
  ChatContactId,
  MessagesChatMessage,
  MessagesChatResponse,
} from "@/types";

type CallMode = "call" | "facetime";

interface PhoneAppProps {
  onOpenMessages: (contactId: ChatContactId) => void;
}

const INITIAL_CALL_STT_STATE: DeepgramRealtimeState = {
  session: {
    sessionId: null,
    modelId: "nova-3",
    status: "idle",
  },
  isListening: false,
  transcript: "",
  partialTranscript: "",
  lastFinalTranscript: "",
  error: null,
  microphonePermission: "unknown",
};

export function PhoneApp({ onOpenMessages }: PhoneAppProps) {
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2.45rem] bg-[#f7f7f9] text-[#111111]">
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
          onFaceTime={() => openCall(contact.id, "call")}
          onMessage={() => onOpenMessages(contact.id)}
        />
      ) : (
        <>
          <PhoneHeader />
          <div className="min-h-0 flex-1 overflow-y-auto bg-[#ffffff]">
            <ContactsGridScreen onOpenContact={openContact} />
          </div>
        </>
      )}
    </div>
  );
}

function PhoneHeader() {
  return (
    <div className="border-b border-black/6 bg-[rgba(248,248,250,0.94)] px-4 pb-3 pt-4 backdrop-blur-xl">
      <h1 className="mt-2 text-[2rem] font-semibold tracking-[-0.05em] text-[#111111]">Contacts</h1>
    </div>
  );
}

function ContactsGridScreen({ onOpenContact }: { onOpenContact: (contactId: ChatContactId) => void }) {
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
  const [messages, setMessages] = useState<MessagesChatMessage[]>([]);
  const [statusLabel, setStatusLabel] = useState(
    mode === "facetime" ? "FaceTime connected" : "On call",
  );
  const [isThinking, setIsThinking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [sttState, setSttState] = useState<DeepgramRealtimeState>(INITIAL_CALL_STT_STATE);
  const messagesRef = useRef<MessagesChatMessage[]>([]);
  const isThinkingRef = useRef(false);
  const isRemoteSpeakingRef = useRef(false);
  const mountedRef = useRef(true);
  const holdToTalkRef = useRef(false);
  const callSttClientRef = useRef<DeepgramRealtimeClient>(new DeepgramRealtimeClient());
  const previousFinalTranscriptRef = useRef("");
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    isRemoteSpeakingRef.current = isRemoteSpeaking;
  }, [isRemoteSpeaking]);

  useEffect(() => {
    mountedRef.current = true;
    setStatusLabel("Hold mute to talk");

    const client = callSttClientRef.current;
    const unsubscribe = client.subscribe((nextState) => {
      if (!mountedRef.current) {
        return;
      }

      setSttState(nextState);

      if (nextState.isListening && !isThinkingRef.current && !isRemoteSpeakingRef.current) {
        setStatusLabel("Listening...");
      } else if (
        !nextState.isListening &&
        !isThinkingRef.current &&
        !isRemoteSpeakingRef.current
      ) {
        setStatusLabel("Hold mute to talk");
      }

      const finalTranscript = nextState.lastFinalTranscript.trim();
      if (
        finalTranscript &&
        finalTranscript !== previousFinalTranscriptRef.current
      ) {
        previousFinalTranscriptRef.current = finalTranscript;
        void handleUserTranscript(finalTranscript);
        client.clearCommittedTranscript();
      }

      if (!finalTranscript) {
        previousFinalTranscriptRef.current = "";
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
      void client.stopListening();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  async function handleUserTranscript(transcript: string) {
    const trimmed = transcript.trim();
    if (!trimmed || !mountedRef.current) {
      return;
    }

    setIsThinking(true);
    setStatusLabel("Thinking...");
    setCallError(null);

    const userMessage: MessagesChatMessage = {
      id: `${contact.id}-call-user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: Date.now(),
    };

    const nextMessages = [...messagesRef.current, userMessage];
    setMessages(nextMessages);

    try {
      const response = await fetch("/api/messages-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactId: contact.id,
          messages: nextMessages,
        }),
      });

      const payload = (await response.json()) as
        | MessagesChatResponse
        | { error?: string };

      if (!response.ok || "error" in payload || !("reply" in payload)) {
        throw new Error(("error" in payload && payload.error) || "Call response failed.");
      }

      const replyText = payload.reply.trim();
      const replyMessage: MessagesChatMessage = {
        id: `${contact.id}-call-contact-${Date.now() + 1}`,
        sender: "contact",
        text: replyText,
        timestamp: Date.now() + 1,
      };

      setMessages((current) => [...current, replyMessage]);
      setIsThinking(false);
      setIsRemoteSpeaking(true);
      setStatusLabel(`${contact.name} is speaking...`);

      await speakContactReply(replyText, contact.voiceId);

      if (!mountedRef.current) {
        return;
      }

      setIsRemoteSpeaking(false);
      setStatusLabel("Hold mute to talk");
    } catch (nextError) {
      if (!mountedRef.current) {
        return;
      }

      setIsThinking(false);
      setIsRemoteSpeaking(false);
      setStatusLabel("Call error");
      setCallError(nextError instanceof Error ? nextError.message : "Call response failed.");
    }
  }

  async function startListening() {
    if (!mountedRef.current || isThinkingRef.current || isRemoteSpeakingRef.current) {
      return;
    }

    try {
      await callSttClientRef.current.startListening();
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }

      setStatusLabel("Call error");
      setCallError(
        error instanceof Error ? error.message : "Realtime call transcription failed.",
      );
    }
  }

  async function stopListening() {
    holdToTalkRef.current = false;
    await callSttClientRef.current.stopListening();
  }

  async function beginHoldToTalk() {
    if (isThinkingRef.current || isRemoteSpeakingRef.current) {
      return;
    }

    holdToTalkRef.current = true;
    setCallError(null);
    await startListening();
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#0e131b,#04070d)] text-white">
      <div className="absolute inset-0 bg-black" />

      <div className="relative z-10 flex h-full flex-col px-5 pb-8 pt-12">
        <div className="text-center">
          <p className="text-[0.8rem] uppercase tracking-[0.26em] text-white/56">
            {mode === "facetime" ? "FaceTime" : "Phone"}
          </p>
          <h1 className="mt-3 text-[2rem] font-semibold tracking-[-0.05em]">{contact.name}</h1>
          <p className="mt-2 text-[0.84rem] text-white/72">{statusLabel}</p>
          {sttState.partialTranscript ? (
            <p className="mx-auto mt-3 max-w-[16rem] text-[0.76rem] leading-5 text-white/52">
              {sttState.partialTranscript}
            </p>
          ) : null}
          {callError || sttState.error ? (
            <p className="mx-auto mt-3 max-w-[16rem] text-[0.76rem] leading-5 text-rose-200/84">
              {callError || sttState.error}
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className="relative flex h-[11.5rem] w-[11.5rem] items-center justify-center"
            aria-label={`${contact.name} call visual`}
          >
            <div className="absolute inset-[1.2rem] rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] blur-md" />
            <div className="relative h-[7.75rem] w-[7.75rem] overflow-hidden rounded-full border border-white/16">
              <Image
                src={contact.avatar}
                alt={contact.name}
                fill
                sizes="124px"
                className="object-cover"
              />
            </div>
          </button>
        </div>

        <div className="mt-auto">
          <div className="mx-auto grid max-w-[5rem] grid-cols-1 gap-4 pb-6">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onMouseDown={() => void beginHoldToTalk()}
                onMouseUp={() => void stopListening()}
                onMouseLeave={() => void stopListening()}
                onTouchStart={() => void beginHoldToTalk()}
                onTouchEnd={() => void stopListening()}
                onTouchCancel={() => void stopListening()}
                className={`flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full text-[0.72rem] font-medium backdrop-blur-xl transition ${
                  sttState.isListening
                    ? "bg-cyan-200/28 text-white shadow-[0_0_24px_rgba(112,255,224,0.22)]"
                    : "bg-white/16 text-white"
                }`}
              >
                mute
              </button>
            </div>
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

async function fetchContactSpeechAudio(text: string, voiceId?: string) {
  const response = await fetch("/api/elevenlabs/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, voiceId }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Failed to generate call speech.");
  }

  return response.arrayBuffer();
}

async function speakContactReply(text: string, voiceId?: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  try {
    const audioBytes = await fetchContactSpeechAudio(trimmed, voiceId);
    const audioBlob = new Blob([audioBytes], { type: "audio/mpeg" });
    const objectUrl = URL.createObjectURL(audioBlob);
    const portfolioVolume = usePortfolioStore.getState().portfolioVolume;

    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(objectUrl);
      audio.volume = portfolioVolume;
      audio.onended = () => {
        URL.revokeObjectURL(objectUrl);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unable to play contact speech."));
      };

      void audio.play().catch((error) => {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      });
    });
  } catch (error) {
    await speakContactReplyWithBrowserFallback(trimmed);
    if (process.env.NODE_ENV === "development") {
      console.warn("[PhoneCall] ElevenLabs fallback to browser TTS", error);
    }
  }
}

async function speakContactReplyWithBrowserFallback(text: string) {
  if (!("speechSynthesis" in window)) {
    throw new Error("Browser speech synthesis is unavailable.");
  }

  const synthesis = window.speechSynthesis;
  synthesis.cancel();

  await new Promise<void>((resolve, reject) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const englishVoice = synthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("en"));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.volume = usePortfolioStore.getState().portfolioVolume;
    utterance.rate = 0.97;
    utterance.pitch = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error("Browser speech fallback failed."));
    synthesis.speak(utterance);
  });
}
