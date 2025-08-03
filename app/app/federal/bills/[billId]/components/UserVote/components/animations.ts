import gsap from "gsap";

// Types for our animation functions
type CardElement = HTMLElement | null;
type AnimationCallback = () => void;

interface AnimationConfig {
  onComplete?: () => void;
}

export const initializeCards = (noCard: CardElement, yesCard: CardElement) => {
  if (!noCard || !yesCard) return;

  // Initial positions - cards start visible
  gsap.set([noCard, yesCard], {
    y: 0,
  });

  gsap.set(noCard, {
    x: "25%",
    rotation: -15,
  });

  gsap.set(yesCard, {
    x: "-25%",
    rotation: 15,
  });

  // Start floating animations immediately
  createFloatingAnimation(noCard, -15);
  createFloatingAnimation(yesCard, 15);
};

export const createFloatingAnimation = (
  element: CardElement,
  baseRotation: number
) => {
  if (!element) return;

  return gsap.to(element, {
    y: "+=10",
    rotation: `${baseRotation + (baseRotation < 0 ? -2 : 2)}`,
    duration: 2,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
};

export const createEntryAnimations = (
  noCard: CardElement,
  yesCard: CardElement,
  config?: AnimationConfig
) => {
  if (!noCard || !yesCard) return;

  const mainTl = gsap.timeline({
    defaults: { ease: "power3.out" },
  });

  // Yes card animation
  mainTl
    .to(yesCard, {
      x: "0%",
      scale: 1,
      opacity: 1,
      rotation: 8,
      duration: 1,
      delay: 0.5, // Reduced delay for faster entry
      onComplete: () => {
        createFloatingAnimation(yesCard, 8);
      },
    })
    // No card animation - follows after Yes card
    .to(
      noCard,
      {
        x: "0%",
        scale: 1,
        opacity: 1,
        rotation: -8,
        duration: 1,
        onComplete: () => {
          createFloatingAnimation(noCard, -8);
          config?.onComplete?.();
        },
      },
      ">"
    );

  return mainTl;
};

export const setupHoverAnimations = (
  hoveredCard: CardElement,
  otherCard: CardElement,
  baseRotation: number
) => {
  if (!hoveredCard || !otherCard) return;

  const enterAnimation = () => {
    gsap.killTweensOf([hoveredCard, otherCard]);

    gsap.to(hoveredCard, {
      scale: 1.2,
      rotation: baseRotation * 2,
      y: -20,
      duration: 0.4,
      ease: "back.out(1.7)",
    });

    gsap.to(otherCard, {
      scale: 0.8,
      rotation: baseRotation * -1.5,
      y: 10,
      opacity: 0.5,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const leaveAnimation = () => {
    gsap.to(hoveredCard, {
      scale: 1,
      rotation: baseRotation,
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: "elastic.out(1, 0.5)",
      onComplete: () => {
        createFloatingAnimation(hoveredCard, baseRotation);
      },
    });

    gsap.to(otherCard, {
      scale: 1,
      rotation: -baseRotation,
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: "elastic.out(1, 0.5)",
      onComplete: () => {
        createFloatingAnimation(otherCard, -baseRotation);
      },
    });
  };

  hoveredCard.addEventListener("mouseenter", enterAnimation);
  hoveredCard.addEventListener("mouseleave", leaveAnimation);

  // Return cleanup function
  return () => {
    hoveredCard.removeEventListener("mouseenter", enterAnimation);
    hoveredCard.removeEventListener("mouseleave", leaveAnimation);
  };
};

export const playVoteAnimation = (
  selectedCard: CardElement,
  otherCard: CardElement,
  isYesVote: boolean
) => {
  if (!selectedCard || !otherCard) return;

  // Kill any existing animations
  gsap.killTweensOf([selectedCard, otherCard]);

  // Timeline for the voting animation
  const voteTl = gsap.timeline();

  // First, smoothly center both cards and prepare for the vote
  voteTl
    .to([selectedCard, otherCard], {
      x: "0%",
      scale: 1,
      duration: 0.3,
      ease: "power2.out",
    })
    // Make selected card prominent
    .to(selectedCard, {
      scale: 1.2,
      y: -20,
      rotation: isYesVote ? 10 : -10,
      duration: 0.2,
      ease: "back.out(1.7)",
    })
    // Fade other card
    .to(
      otherCard,
      {
        scale: 0.8,
        opacity: 0.3,
        y: 10,
        duration: 0.2,
      },
      "<"
    )
    // Dramatic exit - selected card flies off smoothly
    .to(selectedCard, {
      x: isYesVote ? "100vw" : "-100vw",
      y: "-50vh",
      rotation: isYesVote ? 45 : -45,
      scale: 0.8,
      duration: 0.8,
      ease: "power2.in",
    })
    // Other card falls away
    .to(
      otherCard,
      {
        y: "50vh",
        opacity: 0,
        scale: 0.5,
        duration: 0.6,
        ease: "power2.in",
      },
      "<0.2"
    );

  return voteTl;
};
