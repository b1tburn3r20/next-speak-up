import gsap from "gsap";

// Enhanced function with better spacing to prevent overlapping
const calculateBundledPosition = (
  index: number,
  direction: boolean,
  totalInGroup: number
) => {
  // Base positions for yes/no groups
  const baseX = direction ? 650 : -600;

  // Calculate spacing based on group size - larger groups need more spacing
  const spacing = Math.max(40, Math.min(80, 200 / totalInGroup));

  // Calculate staggered positions with better distribution
  // This creates a more uniform spacing between avatars
  const bundleOffset = index * spacing;

  // Add a larger random offset to prevent exact overlap
  const randomOffset = Math.random() * 15 - 7.5; // -7.5 to +7.5 range

  return baseX - (direction ? bundleOffset : -bundleOffset) + randomOffset;
};

// Improve vertical distribution as well
const getRandomY = (index: number) => {
  // Create a more staggered vertical positioning
  const baseY = 150;
  const rowPosition = Math.floor(index / 3); // Create a rough "row" concept
  const verticalSpacing = 30;
  const randomVariation = Math.random() * 20 - 10; // -10 to +10 range

  return baseY + rowPosition * verticalSpacing + randomVariation;
};

const createFloatingAnimation = (element: HTMLElement, index: number) => {
  const duration = 2 + (index % 3) * 0.2;
  const yAmount = 8 + (index % 4) * 2;

  return gsap.to(element, {
    y: `+=${yAmount}`,
    rotation: index % 2 === 0 ? 5 : -5,
    duration: duration,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
    delay: (index * 0.2) % 1,
  });
};

// Function to set up hover effects for each avatar
const setupAvatarHover = (avatar: HTMLElement) => {
  const hoverTimeline = gsap.timeline({ paused: true });

  // Add z-index increase to the hover animation
  hoverTimeline
    .set(avatar, {
      zIndex: 200,
    })
    .to(avatar, {
      scale: 1.15,
      duration: 0.2,
      ease: "back.out(1.7)",
    });

  avatar.addEventListener("mouseenter", () => {
    // Kill the floating animation temporarily
    gsap.killTweensOf(avatar, "y,rotation");
    hoverTimeline.play();
  });

  avatar.addEventListener("mouseleave", () => {
    hoverTimeline.reverse();
    // Reset z-index after animation completes
    hoverTimeline.eventCallback("onReverseComplete", () => {
      gsap.set(avatar, { zIndex: 55 });
    });
    // Restart the floating animation
    const index = Array.from(avatar.parentElement?.children || []).indexOf(
      avatar
    );
    createFloatingAnimation(avatar, index);
  });
};

export const playMemberVotesAnimation = (
  container: HTMLElement | null,
  memberVotes: any[],
  userVoteDirection: boolean
) => {
  if (!container) return;

  const timeline = gsap.timeline();
  const avatars = container.querySelectorAll(".member-avatar");

  gsap.set(avatars, {
    y: -50,
    x: (index) => Math.random() * 60 - 30,
    scale: 0,
    zIndex: 55,
    visibility: "visible",
    opacity: 0,
    position: "absolute",
    left: "50%",
    xPercent: -50,
  });

  const yesVotes: HTMLElement[] = [];
  const noVotes: HTMLElement[] = [];

  avatars.forEach((avatar, index) => {
    const member = memberVotes[index];
    const voteDirection = member.isUser
      ? userVoteDirection
      : member.votePosition === "YEA";

    if (voteDirection) {
      yesVotes.push(avatar as HTMLElement);
    } else {
      noVotes.push(avatar as HTMLElement);
    }
  });

  const animateVoteGroup = (
    votes: HTMLElement[],
    isYesGroup: boolean,
    startDelay: number
  ) => {
    // Pass the total group size to the position calculator
    const totalInGroup = votes.length;

    votes.forEach((avatar, groupIndex) => {
      const member =
        memberVotes[
          votes === yesVotes ? groupIndex : groupIndex + yesVotes.length
        ];
      const randomY = getRandomY(groupIndex);
      const finalX = calculateBundledPosition(
        groupIndex,
        isYesGroup,
        totalInGroup
      );

      const avatarTl = gsap.timeline({
        delay: startDelay + groupIndex * 0.1,
        onComplete: () => {
          createFloatingAnimation(avatar, groupIndex);
          // Set up hover effects after initial animation
          setupAvatarHover(avatar);
        },
      });

      avatarTl
        .to(avatar, {
          duration: 0.3,
          opacity: 1,
          scale: 1,
          ease: "back.out(1.7)",
        })
        .to(avatar, {
          duration: 0.4,
          y: randomY,
          ease: "power2.in",
        })
        .to(avatar, {
          duration: 0.8,
          x: finalX,
          xPercent: 0,
          ease: "power2.inOut",
        });

      timeline.add(avatarTl, startDelay + groupIndex * 0.05);
    });
  };

  animateVoteGroup(yesVotes, true, 0);
  animateVoteGroup(noVotes, false, 0.1);

  return timeline;
};
