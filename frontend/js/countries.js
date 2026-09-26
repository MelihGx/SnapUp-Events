export const COUNTRY_CODES = Object.freeze([
  "AD",
  "AE",
  "AF",
  "AG",
  "AI",
  "AL",
  "AM",
  "AO",
  "AQ",
  "AR",
  "AS",
  "AT",
  "AU",
  "AW",
  "AX",
  "AZ",
  "BA",
  "BB",
  "BD",
  "BE",
  "BF",
  "BG",
  "BH",
  "BI",
  "BJ",
  "BL",
  "BM",
  "BN",
  "BO",
  "BQ",
  "BR",
  "BS",
  "BT",
  "BV",
  "BW",
  "BY",
  "BZ",
  "CA",
  "CC",
  "CD",
  "CF",
  "CG",
  "CH",
  "CI",
  "CK",
  "CL",
  "CM",
  "CN",
  "CO",
  "CR",
  "CU",
  "CV",
  "CW",
  "CX",
  "CY",
  "CZ",
  "DE",
  "DJ",
  "DK",
  "DM",
  "DO",
  "DZ",
  "EC",
  "EE",
  "EG",
  "EH",
  "ER",
  "ES",
  "ET",
  "FI",
  "FJ",
  "FK",
  "FM",
  "FO",
  "FR",
  "GA",
  "GB",
  "GD",
  "GE",
  "GF",
  "GG",
  "GH",
  "GI",
  "GL",
  "GM",
  "GN",
  "GP",
  "GQ",
  "GR",
  "GS",
  "GT",
  "GU",
  "GW",
  "GY",
  "HK",
  "HM",
  "HN",
  "HR",
  "HT",
  "HU",
  "ID",
  "IE",
  "IL",
  "IM",
  "IN",
  "IO",
  "IQ",
  "IR",
  "IS",
  "IT",
  "JE",
  "JM",
  "JO",
  "JP",
  "KE",
  "KG",
  "KH",
  "KI",
  "KM",
  "KN",
  "KP",
  "KR",
  "KW",
  "KY",
  "KZ",
  "LA",
  "LB",
  "LC",
  "LI",
  "LK",
  "LR",
  "LS",
  "LT",
  "LU",
  "LV",
  "LY",
  "MA",
  "MC",
  "MD",
  "ME",
  "MF",
  "MG",
  "MH",
  "MK",
  "ML",
  "MM",
  "MN",
  "MO",
  "MP",
  "MQ",
  "MR",
  "MS",
  "MT",
  "MU",
  "MV",
  "MW",
  "MX",
  "MY",
  "MZ",
  "NA",
  "NC",
  "NE",
  "NF",
  "NG",
  "NI",
  "NL",
  "NO",
  "NP",
  "NR",
  "NU",
  "NZ",
  "OM",
  "PA",
  "PE",
  "PF",
  "PG",
  "PH",
  "PK",
  "PL",
  "PM",
  "PN",
  "PR",
  "PS",
  "PT",
  "PW",
  "PY",
  "QA",
  "RE",
  "RO",
  "RS",
  "RU",
  "RW",
  "SA",
  "SB",
  "SC",
  "SD",
  "SE",
  "SG",
  "SH",
  "SI",
  "SJ",
  "SK",
  "SL",
  "SM",
  "SN",
  "SO",
  "SR",
  "SS",
  "ST",
  "SV",
  "SX",
  "SY",
  "SZ",
  "TC",
  "TD",
  "TF",
  "TG",
  "TH",
  "TJ",
  "TK",
  "TL",
  "TM",
  "TN",
  "TO",
  "TR",
  "TT",
  "TV",
  "TW",
  "TZ",
  "UA",
  "UG",
  "UM",
  "US",
  "UY",
  "UZ",
  "VA",
  "VC",
  "VE",
  "VG",
  "VI",
  "VN",
  "VU",
  "WF",
  "WS",
  "XK",
  "YE",
  "YT",
  "ZA",
  "ZM",
  "ZW"
]);

function normalizeLocale(value) {
  const raw = String(value || "en").trim().replaceAll("_", "-");
  if (!raw) return "en";

  const parts = raw.split("-");
  if (parts.length === 1) return parts[0].toLowerCase();

  return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
}

export function getCountryName(code, locale = null) {
  const normalizedCode = String(code || "").trim().toUpperCase();

  if (!normalizedCode) return "Not set";
  if (normalizedCode === "XK") {
    const currentLocale = normalizeLocale(
      locale ||
      window.SnapUpI18n?.language ||
      document.documentElement.lang ||
      navigator.language ||
      "en"
    );

    const kosovoNames = {
      tr: "Kosova",
      sq: "Kosova",
      sr: "Kosovo",
      bs: "Kosovo",
      hr: "Kosovo",
      mk: "Косово",
      de: "Kosovo",
      fr: "Kosovo",
      es: "Kosovo",
      it: "Kosovo",
      en: "Kosovo",
    };

    return kosovoNames[currentLocale] ||
      kosovoNames[currentLocale.split("-")[0]] ||
      "Kosovo";
  }

  try {
    const currentLocale = normalizeLocale(
      locale ||
      window.SnapUpI18n?.language ||
      document.documentElement.lang ||
      navigator.language ||
      "en"
    );

    const displayNames = new Intl.DisplayNames(
      [currentLocale, "en"],
      { type: "region" }
    );

    return displayNames.of(normalizedCode) || normalizedCode;
  } catch {
    return normalizedCode;
  }
}

export function getCountryFlag(code) {
  const normalizedCode = String(code || "").trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalizedCode)) return "";

  return [...normalizedCode]
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join("");
}

export function populateCountrySelect(
  select,
  {
    selectedCode = "",
    placeholder = "Select your country",
    locale = null,
  } = {},
) {
  if (!select) return;

  const currentLocale = normalizeLocale(
    locale ||
    window.SnapUpI18n?.language ||
    localStorage.getItem("snapup_language") ||
    document.documentElement.lang ||
    navigator.language ||
    "en"
  );

  let collator;
  try {
    collator = new Intl.Collator(currentLocale, { sensitivity: "base" });
  } catch {
    collator = new Intl.Collator("en", { sensitivity: "base" });
  }

  const items = COUNTRY_CODES.map((code) => ({
    code,
    name: getCountryName(code, currentLocale),
  })).sort((a, b) => collator.compare(a.name, b.name));

  const safeSelected = String(selectedCode || "").trim().toUpperCase();

  select.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = placeholder;
  emptyOption.disabled = true;
  emptyOption.selected = !safeSelected;
  select.appendChild(emptyOption);

  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.code;
    option.textContent = `${getCountryFlag(item.code)} ${item.name}`;
    option.selected = item.code === safeSelected;
    select.appendChild(option);
  });
}


export function mountCountryCombobox({
  root,
  searchInput,
  hiddenInput,
  menu,
  toggleButton,
  placeholder = "Select your country",
  noResultsText = "No countries found",
  locale = null,
} = {}) {
  if (!root || !searchInput || !hiddenInput || !menu) {
    return {
      refresh() {},
      close() {},
      open() {},
      getValue() {
        return hiddenInput?.value || "";
      },
    };
  }

  const currentLocale = normalizeLocale(
    locale ||
    window.SnapUpI18n?.language ||
    localStorage.getItem("snapup_language") ||
    document.documentElement.lang ||
    navigator.language ||
    "en"
  );

  let collator;
  try {
    collator = new Intl.Collator(currentLocale, {
      sensitivity: "base",
      usage: "sort",
    });
  } catch {
    collator = new Intl.Collator("en", {
      sensitivity: "base",
      usage: "sort",
    });
  }

  const countries = COUNTRY_CODES.map((code) => ({
    code,
    name: getCountryName(code, currentLocale),
    flag: getCountryFlag(code),
  }));

  countries.sort((a, b) => collator.compare(a.name, b.name));

  let filtered = [...countries];
  let activeIndex = -1;
  let isOpen = false;

  function normalizeSearch(value) {
    return String(value || "")
      .trim()
      .toLocaleLowerCase(currentLocale)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function rankCountries(query) {
    const normalizedQuery = normalizeSearch(query);

    if (!normalizedQuery) {
      return [...countries];
    }

    const starts = [];
    const contains = [];

    countries.forEach((country) => {
      const normalizedName = normalizeSearch(country.name);
      const normalizedCode = normalizeSearch(country.code);

      if (
        normalizedName.startsWith(normalizedQuery) ||
        normalizedCode.startsWith(normalizedQuery)
      ) {
        starts.push(country);
        return;
      }

      if (
        normalizedName.includes(normalizedQuery) ||
        normalizedCode.includes(normalizedQuery)
      ) {
        contains.push(country);
      }
    });

    starts.sort((a, b) => collator.compare(a.name, b.name));
    contains.sort((a, b) => collator.compare(a.name, b.name));

    return [...starts, ...contains];
  }

  function setExpanded(expanded) {
    isOpen = expanded;
    root.classList.toggle("is-open", expanded);
    menu.hidden = !expanded;
    searchInput.setAttribute("aria-expanded", String(expanded));
  }

  function close() {
    activeIndex = -1;
    setExpanded(false);
  }

  function optionId(country) {
    return `country-option-${country.code}`;
  }

  function render() {
    menu.innerHTML = "";

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "country-combobox__empty";
      empty.textContent = noResultsText;
      menu.appendChild(empty);
      searchInput.removeAttribute("aria-activedescendant");
      return;
    }

    filtered.forEach((country, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "country-combobox__option";
      button.id = optionId(country);
      button.setAttribute("role", "option");
      button.setAttribute(
        "aria-selected",
        String(hiddenInput.value === country.code)
      );

      if (index === activeIndex) {
        button.classList.add("is-active");
      }

      if (hiddenInput.value === country.code) {
        button.classList.add("is-selected");
      }

      const flag = document.createElement("span");
      flag.className = "country-combobox__flag";
      flag.textContent = country.flag;

      const label = document.createElement("span");
      label.textContent = country.name;

      button.append(flag, label);

      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });

      button.addEventListener("click", () => {
        selectCountry(country);
      });

      menu.appendChild(button);
    });

    if (activeIndex >= 0 && filtered[activeIndex]) {
      searchInput.setAttribute(
        "aria-activedescendant",
        optionId(filtered[activeIndex])
      );
    } else {
      searchInput.removeAttribute("aria-activedescendant");
    }
  }

  function open() {
    if (!isOpen) {
      setExpanded(true);
    }
    render();
  }

  function selectCountry(country) {
    hiddenInput.value = country.code;
    searchInput.value = country.name;
    searchInput.setCustomValidity("");
    hiddenInput.dispatchEvent(
      new Event("change", { bubbles: true })
    );
    close();
  }

  function clearSelectionIfTextChanged() {
    const current = countries.find(
      (country) => country.code === hiddenInput.value
    );

    if (!current) return;

    if (
      normalizeSearch(searchInput.value) !==
      normalizeSearch(current.name)
    ) {
      hiddenInput.value = "";
    }
  }

  function refresh() {
    filtered = rankCountries(searchInput.value);
    activeIndex = filtered.length ? 0 : -1;
    render();
  }

  searchInput.placeholder = placeholder;

  searchInput.addEventListener("focus", () => {
    refresh();
    open();
  });

  searchInput.addEventListener("input", () => {
    clearSelectionIfTextChanged();
    filtered = rankCountries(searchInput.value);
    activeIndex = filtered.length ? 0 : -1;
    open();
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) open();

      if (filtered.length) {
        activeIndex = (activeIndex + 1) % filtered.length;
        render();
        menu
          .querySelector(".country-combobox__option.is-active")
          ?.scrollIntoView({ block: "nearest" });
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) open();

      if (filtered.length) {
        activeIndex =
          (activeIndex - 1 + filtered.length) % filtered.length;
        render();
        menu
          .querySelector(".country-combobox__option.is-active")
          ?.scrollIntoView({ block: "nearest" });
      }
      return;
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault();

      const selected =
        activeIndex >= 0 ? filtered[activeIndex] : filtered[0];

      if (selected) {
        selectCountry(selected);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });

  searchInput.addEventListener("blur", () => {
    window.setTimeout(() => {
      const current = countries.find(
        (country) => country.code === hiddenInput.value
      );

      if (current) {
        searchInput.value = current.name;
        searchInput.setCustomValidity("");
      } else if (searchInput.value.trim()) {
        searchInput.setCustomValidity("Please select a country from the list.");
      }

      close();
    }, 120);
  });

  toggleButton?.addEventListener("click", () => {
    searchInput.focus();

    if (isOpen) {
      close();
    } else {
      refresh();
      open();
    }
  });

  document.addEventListener("click", (event) => {
    if (!root.contains(event.target)) {
      close();
    }
  });

  return {
    refresh,
    close,
    open,
    getValue() {
      return hiddenInput.value;
    },
  };
}
