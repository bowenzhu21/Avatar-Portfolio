import type { ChatContact } from "@/types";

export const bowenContact: ChatContact = {
  id: "bowen",
  name: "Bowen",
  avatar: "/messages/bowen.jpeg",
  phoneLabel: "iMessage",
};

export const phoneContacts: ChatContact[] = [
  {
    id: "lara",
    name: "Lara",
    avatar: "/phone/Lara.png",
    favorite: true,
    phoneLabel: "mobile",
    phoneNumber: "(415) 555-0143",
    voiceId: "TxGi1N29NQoCaYD4fcU5",
  },
  {
    id: "john",
    name: "John",
    avatar: "/phone/John.png",
    favorite: true,
    phoneLabel: "mobile",
    phoneNumber: "(650) 555-0191",
    voiceId: "wSqOdjeNqDrHcoK0zorF",
  },
];

export const allChatContacts: ChatContact[] = [bowenContact, ...phoneContacts];

export function getChatContactById(id: ChatContact["id"]) {
  return allChatContacts.find((contact) => contact.id === id) ?? null;
}
