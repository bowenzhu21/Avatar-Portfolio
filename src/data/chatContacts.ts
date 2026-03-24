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
    heygenAvatarId: "65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0",
    favorite: true,
    phoneLabel: "mobile",
    phoneNumber: "(415) 555-0143",
  },
  {
    id: "john",
    name: "John",
    avatar: "/phone/John.png",
    heygenAvatarId: "9650a758-1085-4d49-8bf3-f347565ec229",
    favorite: true,
    phoneLabel: "mobile",
    phoneNumber: "(650) 555-0191",
  },
];

export const allChatContacts: ChatContact[] = [bowenContact, ...phoneContacts];

export function getChatContactById(id: ChatContact["id"]) {
  return allChatContacts.find((contact) => contact.id === id) ?? null;
}
