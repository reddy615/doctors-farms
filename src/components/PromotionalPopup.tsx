import { useEffect, useRef, useState } from "react";

const POPUP_SESSION_KEY = "doctors-farms-promotion-shown";

export default function PromotionalPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (window.sessionStorage.getItem(POPUP_SESSION_KEY)) {
      return;
    }

    const timerId = window.setTimeout(() => {
      window.sessionStorage.setItem(POPUP_SESSION_KEY, "true");
      setIsOpen(true);
    }, 2000);

    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const closePopup = () => setIsOpen(false);

  return (
    <div
      className="promotional-popup"
      onClick={closePopup}
      role="presentation"
    >
      <section
        aria-label="Doctors Farms promotional offer"
        aria-modal="true"
        className="promotional-popup__dialog"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button
          aria-label="Close promotional offer"
          className="promotional-popup__close"
          onClick={closePopup}
          ref={closeButtonRef}
          type="button"
        >
          <span aria-hidden="true">✕</span>
        </button>
        <img
          alt="Doctors Farms Vision Venture Function Hall promotional poster"
          className="promotional-popup__image"
          src="/images/vision-venture-function-hall.png"
        />
      </section>
    </div>
  );
}
