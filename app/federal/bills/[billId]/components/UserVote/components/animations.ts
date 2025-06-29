import gsap from "gsap";

// Types for our animation functions
type CardElement = HTMLElement | null;
type AnimationCallback = () => void;

interface AnimationConfig {
  onComplete?: () => void;
}

export const initializeCards = (noCard: CardElement, yesCard: CardElement) => {
  if (!noCard || !yesCard) return;

  // Initial positions
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
  const voteTl = gsap.timeline({
    defaults: { ease: "power3.out" },
  });

  // Selected card flies up
  voteTl
    .to(selectedCard, {
      y: -100,
      scale: 1.2,
      rotation: isYesVote ? 15 : -15,
      duration: 0.5,
    })
    // Other card flies down and fades
    .to(
      otherCard,
      {
        y: 100,
        scale: 0.8,
        opacity: 0,
        rotation: isYesVote ? -15 : 15,
        duration: 0.5,
      },
      "<"
    )
    // Selected card flies off screen
    .to(selectedCard, {
      x: isYesVote ? "100vw" : "-100vw",
      y: "-50vh",
      rotation: isYesVote ? 45 : -45,
      duration: 0.8,
      ease: "power2.in",
    });

  return voteTl;
};
