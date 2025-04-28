// deno-lint-ignore-file require-await
const STORAGE_KEY = "fixItThingWandId";

export async function setWandId(wandId: string) {
  localStorage.setItem(STORAGE_KEY, wandId);
}

export async function getWandId(): Promise<string> {
  return localStorage.getItem(STORAGE_KEY)!;
}
