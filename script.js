const loader = document.getElementById("siteLoader");
const siteHeader = document.querySelector(".site-header");
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const navLinks = Array.from(document.querySelectorAll('.nav-menu a[href^="#"]'));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const availableDates = document.getElementById("availableDates");
const urgencyBadge = document.getElementById("urgencyBadge");
const preferredDate = document.getElementById("preferredDate");
const bookingForm = document.getElementById("bookingForm");

window.addEventListener("load", () => {
  window.setTimeout(() => {
    loader?.classList.add("is-hidden");
  }, 700);
});

const toggleHeaderState = () => {
  if (!siteHeader) {
    return;
  }

  siteHeader.classList.toggle("scrolled", window.scrollY > 24);
};

toggleHeaderState();
window.addEventListener("scroll", toggleHeaderState, { passive: true });

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("is-open");
    document.body.classList.toggle("menu-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

revealItems.forEach((item) => {
  if (item.dataset.delay) {
    item.style.setProperty("--delay", item.dataset.delay);
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px",
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const id = entry.target.getAttribute("id");
      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("active", isActive);
      });
    });
  },
  {
    threshold: 0.45,
    rootMargin: "-18% 0px -40% 0px",
  }
);

document.querySelectorAll("main section[id]").forEach((section) => {
  sectionObserver.observe(section);
});

const formatDate = (date, options) =>
  new Intl.DateTimeFormat("en-LK", options).format(date);

const toInputDateValue = (date) => {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().split("T")[0];
};

const getWeekendDates = (startDate, limit = 8) => {
  const dates = [];
  const cursor = new Date(startDate);
  cursor.setDate(cursor.getDate() + 2);

  while (dates.length < limit) {
    const day = cursor.getDay();
    if (day === 5 || day === 6 || day === 0) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const setAvailabilityContent = () => {
  const now = new Date();
  const weekends = getWeekendDates(now, 8);
  const currentMonth = now.getMonth();
  const remainingCurrentMonth = weekends.filter((date) => date.getMonth() === currentMonth);
  const urgencyMonthDate = remainingCurrentMonth[0] || weekends[0];
  const urgencyMonth = formatDate(urgencyMonthDate, { month: "long" });
  const displayCount = Math.max(
    2,
    Math.min(5, Math.ceil((remainingCurrentMonth.length || 4) * 0.6))
  );

  if (urgencyBadge) {
    urgencyBadge.textContent = `Only ${displayCount} prime dates left in ${urgencyMonth}`;
  }

  if (availableDates) {
    availableDates.innerHTML = weekends
      .slice(0, 4)
      .map((date, index) => {
        const label = index === 0 ? "Next opening" : "Popular slot";
        return `
          <span>
            ${formatDate(date, { month: "short", day: "numeric" })}
            <small>${formatDate(date, { weekday: "long" })} / ${label}</small>
          </span>
        `;
      })
      .join("");
  }

  if (preferredDate) {
    preferredDate.min = toInputDateValue(now);

    if (!preferredDate.value && weekends[0]) {
      preferredDate.value = toInputDateValue(weekends[0]);
    }
  }
};

setAvailabilityContent();

if (bookingForm) {
  bookingForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(bookingForm);
    const name = String(formData.get("name") || "").trim();
    const eventType = String(formData.get("eventType") || "").trim();
    const guests = String(formData.get("guests") || "").trim();
    const dateValue = String(formData.get("date") || "").trim();

    const dateText = dateValue
      ? formatDate(new Date(dateValue), {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "a flexible date";

    const message = [
      "Hello The King's Colombo, I'd like to check availability.",
      "",
      `Name: ${name}`,
      `Event: ${eventType}`,
      `Preferred Date: ${dateText}`,
      `Guest Count: ${guests}`,
      "",
      "Please share available packages and next steps.",
    ].join("\n");

    window.open(
      `https://wa.me/94771234567?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener"
    );
  });
}
