// This should replace the existing playMemberVotesAnimation function in your moreanimations.ts file
import gsap from "gsap";

interface AnimationOptions {
  onComplete?: () => void;
}

// Fix the function signature to match your existing code while adding optional callback
export function playMemberVotesAnimation(
  container: HTMLDivElement | null,
  memberVotes: any[],
  isYesVote: boolean,
  options?: AnimationOptions
) {
  if (!container) return null;

  const avatars = container.querySelectorAll(".member-avatar");
  if (!avatars.length) return null;

  // Create timeline with completion callback
  const timeline = gsap.timeline({
    defaults: { duration: 0.6, ease: "power2.out" },
    onComplete: () => {
      if (options?.onComplete) {
        options.onComplete();
      }
    },
  });

  // Sort avatars by user/non-user
  const userAvatar = Array.from(avatars).find((avatar) =>
    avatar.classList.contains("w-20")
  );

  const otherAvatars = Array.from(avatars).filter(
    (avatar) => !avatar.classList.contains("w-20")
  );

  // First animate the user avatar
  if (userAvatar) {
    timeline.to(
      userAvatar,
      {
        opacity: 1,
        scale: 1,
        visibility: "visible",
        x: isYesVote ? 120 : -120, // Use numbers instead of strings with "px"
        y: 0,
        duration: 0.8,
      },
      0
    );
  }

  // Then animate the other avatars in a staggered formation
  if (otherAvatars.length) {
    timeline.to(
      otherAvatars,
      {
        opacity: 1,
        scale: 1,
        visibility: "visible",
        x: (i: number) => {
          const offset = isYesVote ? 180 : -180;
          return offset + (isYesVote ? i * 15 : -i * 15);
        },
        y: (i: number) => {
          const baseY = 80;
          return baseY + i * 20;
        },
        stagger: 0.1,
        duration: 0.6,
      },
      0.2
    );
  }

  return timeline;
}
