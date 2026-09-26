
const SNAPUP_EVENT_TYPES = Object.freeze([
  { code: "wedding", labelKey: "Wedding" },
  { code: "engagement", labelKey: "Engagement" },
  { code: "henna_night", labelKey: "Henna Night" },
  { code: "birthday", labelKey: "Birthday" },
  { code: "graduation", labelKey: "Graduation" },
  { code: "baby_shower", labelKey: "Baby Shower" },
  { code: "anniversary", labelKey: "Anniversary" },
  { code: "corporate", labelKey: "Corporate Event" },
  { code: "conference_seminar", labelKey: "Conference / Seminar" },
  { code: "festival_concert", labelKey: "Festival / Concert" },
  { code: "party_celebration", labelKey: "Party / Celebration" },
  { code: "trip", labelKey: "Trip" },
  { code: "other", labelKey: "Other" },
]);

function snapUpTranslateEventType(text) {
  return window.SnapUpI18n?.t?.(text) || text;
}

function normalizeEventTypeSearch(value, locale) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase(locale || undefined)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function mountEventTypeCombobox({
  root,
  searchInput,
  hiddenInput,
  menu,
  toggleButton,
  placeholder = "Select event type",
  noResultsText = "No event types found",
} = {}) {
  if (!root || !searchInput || !hiddenInput || !menu) {
    return {
      refresh() {},
      open() {},
      close() {},
      getValue() {
        return hiddenInput?.value || "";
      },
    };
  }

  const locale =
    window.SnapUpI18n?.language ||
    document.documentElement.lang ||
    navigator.language ||
    "en";

  let collator;
  try {
    collator = new Intl.Collator(locale, {
      sensitivity: "base",
      usage: "sort",
    });
  } catch {
    collator = new Intl.Collator("en", {
      sensitivity: "base",
      usage: "sort",
    });
  }

  const allTypes = SNAPUP_EVENT_TYPES.map((item) => ({
    ...item,
    label: snapUpTranslateEventType(item.labelKey),
  })).sort((left, right) => collator.compare(left.label, right.label));

  let filtered = [...allTypes];
  let activeIndex = -1;
  let isOpen = false;

  function rankTypes(query) {
    const normalizedQuery = normalizeEventTypeSearch(query, locale);

    if (!normalizedQuery) {
      return [...allTypes];
    }

    const starts = [];
    const contains = [];

    allTypes.forEach((item) => {
      const normalizedLabel = normalizeEventTypeSearch(item.label, locale);
      const normalizedCode = normalizeEventTypeSearch(item.code, locale);

      if (
        normalizedLabel.startsWith(normalizedQuery) ||
        normalizedCode.startsWith(normalizedQuery)
      ) {
        starts.push(item);
        return;
      }

      if (
        normalizedLabel.includes(normalizedQuery) ||
        normalizedCode.includes(normalizedQuery)
      ) {
        contains.push(item);
      }
    });

    starts.sort((left, right) => collator.compare(left.label, right.label));
    contains.sort((left, right) => collator.compare(left.label, right.label));

    return [...starts, ...contains];
  }

  function optionId(item) {
    return `event-type-option-${item.code}`;
  }

  function setExpanded(expanded) {
    isOpen = expanded;
    root.classList.toggle("is-open", expanded);
    menu.hidden = !expanded;
    searchInput.setAttribute("aria-expanded", String(expanded));
  }

  function close() {
    activeIndex = -1;
    searchInput.removeAttribute("aria-activedescendant");
    setExpanded(false);
  }

  function selectType(item) {
    hiddenInput.value = item.code;
    searchInput.value = item.label;
    root.closest("label")?.classList.remove("has-error");
    close();
    hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function render() {
    menu.innerHTML = "";

    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "event-type-combobox__empty";
      empty.textContent = noResultsText;
      menu.appendChild(empty);
      return;
    }

    filtered.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "event-type-combobox__option";
      button.id = optionId(item);
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", String(hiddenInput.value === item.code));

      if (index === activeIndex) {
        button.classList.add("is-active");
      }

      if (hiddenInput.value === item.code) {
        button.classList.add("is-selected");
      }

      button.textContent = item.label;

      button.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });

      button.addEventListener("click", () => {
        selectType(item);
      });

      menu.appendChild(button);
    });

    if (activeIndex >= 0 && filtered[activeIndex]) {
      searchInput.setAttribute(
        "aria-activedescendant",
        optionId(filtered[activeIndex]),
      );
    }
  }

  function refresh() {
    filtered = rankTypes(searchInput.value);
    activeIndex = filtered.length ? 0 : -1;
    render();
  }

  function open() {
    refresh();
    setExpanded(true);
  }

  function clearSelectionIfTextChanged() {
    const current = allTypes.find((item) => item.code === hiddenInput.value);

    if (!current) return;

    if (
      normalizeEventTypeSearch(searchInput.value, locale) !==
      normalizeEventTypeSearch(current.label, locale)
    ) {
      hiddenInput.value = "";
    }
  }

  searchInput.placeholder = placeholder;

  searchInput.addEventListener("focus", open);

  searchInput.addEventListener("input", () => {
    clearSelectionIfTextChanged();
    filtered = rankTypes(searchInput.value);
    activeIndex = filtered.length ? 0 : -1;
    setExpanded(true);
    render();
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        setExpanded(true);
      }
      if (!filtered.length) return;
      activeIndex = (activeIndex + 1) % filtered.length;
      render();
      menu.querySelector(".event-type-combobox__option.is-active")
        ?.scrollIntoView({ block: "nearest" });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setExpanded(true);
      }
      if (!filtered.length) return;
      activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
      render();
      menu.querySelector(".event-type-combobox__option.is-active")
        ?.scrollIntoView({ block: "nearest" });
      return;
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault();
      const selected = activeIndex >= 0 ? filtered[activeIndex] : filtered[0];
      if (selected) {
        selectType(selected);
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
      const current = allTypes.find((item) => item.code === hiddenInput.value);

      if (current) {
        searchInput.value = current.label;
      } else if (!searchInput.value.trim()) {
        hiddenInput.value = "";
      } else {
        hiddenInput.value = "";
        searchInput.value = "";
      }

      close();
    }, 120);
  });

  toggleButton?.addEventListener("click", () => {
    searchInput.focus();

    if (isOpen) {
      close();
    } else {
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
    open,
    close,
    getValue() {
      return hiddenInput.value;
    },
  };
}

window.mountEventTypeCombobox = mountEventTypeCombobox;
