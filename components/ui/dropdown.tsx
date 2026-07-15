// Legacy import path — some templates import "@/components/ui/dropdown",
// others the shadcn-conventional "@/components/ui/dropdown-menu".
// One implementation (radix, see ./dropdown-menu.tsx), two paths.
export * from "./dropdown-menu";
export { default } from "./dropdown-menu";
