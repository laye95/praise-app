import { useEffect, useRef, useMemo } from "react";
import { Keyboard, Platform } from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import type {
  BottomSheetBackdropProps,
  BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { useTheme } from "@/hooks/useTheme";

export { BottomSheetTextInput as BottomSheetDrawerTextInput };

type KeyboardBehavior = "interactive" | "extend" | "fillParent";

interface BottomSheetDrawerProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  enableDynamicSizing?: boolean;
  maxDynamicContentSize?: number;
  showHandle?: boolean;
  enablePanDownToClose?: boolean;
  keyboardBehavior?: KeyboardBehavior;
  footerComponent?: React.FC<BottomSheetFooterProps>;
}

export function BottomSheetDrawer({
  visible,
  onClose,
  children,
  snapPoints = ["90%"],
  enableDynamicSizing = false,
  maxDynamicContentSize,
  showHandle = true,
  enablePanDownToClose = true,
  keyboardBehavior = "interactive",
  footerComponent,
}: BottomSheetDrawerProps) {
  const theme = useTheme();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      const id = requestAnimationFrame(() => {
        ref.current?.present();
      });
      return () => cancelAnimationFrame(id);
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    const eventName =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const sub = Keyboard.addListener(eventName, () => {
      if (visible && !enableDynamicSizing && snapPoints && snapPoints.length > 0) {
        ref.current?.snapToIndex(snapPoints.length - 1);
      }
    });
    return () => sub.remove();
  }, [visible, enableDynamicSizing, snapPoints]);

  const backdropComponent = useMemo(
    () => (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
        opacity={0.5}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={enableDynamicSizing ? undefined : snapPoints}
      enableDynamicSizing={enableDynamicSizing}
      maxDynamicContentSize={maxDynamicContentSize}
      enablePanDownToClose={enablePanDownToClose}
      handleComponent={showHandle ? undefined : null}
      handleIndicatorStyle={
        showHandle
          ? {
              backgroundColor: theme.textTertiary,
              opacity: 0.5,
              width: 40,
            }
          : undefined
      }
      onDismiss={onClose}
      keyboardBehavior={keyboardBehavior}
      keyboardBlurBehavior="restore"
      enableBlurKeyboardOnGesture
      android_keyboardInputMode="adjustResize"
      backdropComponent={backdropComponent}
      footerComponent={footerComponent}
      backgroundStyle={{
        backgroundColor: theme.cardBg,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: theme.cardBorder,
      }}
    >
      {children}
    </BottomSheetModal>
  );
}
