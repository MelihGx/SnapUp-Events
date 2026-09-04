const supabase = require("../config/supabaseClient");

const MAX_SLUG_LENGTH = 90;

function slugifyEventName(value) {
  const source = String(value || "").trim();

  if (!source) {
    return "event";
  }

  const slug = source
    .normalize("NFD")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");

  return slug || "event";
}

async function generateUniqueEventSlug(eventName) {
  const baseSlug = slugifyEventName(eventName);

  for (let suffix = 1; suffix <= 200; suffix += 1) {
    const suffixText = suffix === 1 ? "" : `-${suffix}`;
    const baseLimit = Math.max(1, MAX_SLUG_LENGTH - suffixText.length);
    const candidate = `${baseSlug.slice(0, baseLimit).replace(/-+$/g, "")}${suffixText}`;

    const { data, error } = await supabase
      .from("event")
      .select("event_id")
      .eq("event_slug", candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return candidate;
    }
  }

  throw new Error("Benzersiz event adresi oluşturulamadı.");
}

module.exports = {
  generateUniqueEventSlug,
  slugifyEventName,
};
