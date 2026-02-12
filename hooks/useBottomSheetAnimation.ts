import { useEffect } from "react";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SLIDE_DISTANCE = 500;

interface UseBottomSheetAnimationOptions {
  visible: boolean;
  slideDistance?: number;
}

export function useBottomSheetAnimation({
  visible,
  slideDistance = SLIDE_DISTANCE,
}: UseBottomSheetAnimationOptions) {
  const slideAnim = useSharedValue(slideDistance);
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      slideAnim.value = slideDistance;
      fadeAnim.value = 0;
      fadeAnim.value = withTiming(1, { duration: 180 });
      slideAnim.value = withTiming(0, { duration: 260 });
    } else {
      slideAnim.value = slideDistance;
      fadeAnim.value = 0;
    }
  }, [visible]);

  const close = (onComplete?: () => void) => {
    fadeAnim.value = withTiming(0, { duration: 120 });
    slideAnim.value = withTiming(
      slideDistance,
      { duration: 200 },
      (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      },
    );
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnim.value }],
  }));

  return { close, backdropStyle, sheetStyle };
}
