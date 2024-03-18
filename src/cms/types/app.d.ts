// app.d.ts
/// <reference types="lucia" />
declare namespace Lucia {
  type Auth = import("../auth/lucia").Auth;
  type DatabaseUserAttributes = {
    firstname?: string;
    lastname?: string;
    email?: string;
    role?: string;
  };
  type DatabaseSessionAttributes = {};
}

interface UsesSection {
  title: string;
  items: UsesItem[];
}
interface UsesItem {
  title: string;
  link?: string;
}

interface MediaFile {
  url: string;
  type: string;
  name: string;
  size: number;
  width: number;
  height: number;
  description: string;
}

interface DropdownItem {
  text: string;
  value: string | number;
}
