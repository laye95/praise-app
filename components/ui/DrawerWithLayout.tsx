import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BottomSheetDrawer } from "@/components/ui/BottomSheetDrawer";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useTheme } from "@/hooks/useTheme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export interface DrawerButtonConfig {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

interface DrawerWithLayoutProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  saveButton?: DrawerButtonConfig;
  cancelButton?: DrawerButtonConfig;
  deleteButton?: DrawerButtonConfig;
  snapPoints?: (string | number)[];
}

const FOOTER_MIN_HEIGHT = 180;

export function DrawerWithLayout({
  visible,
  onClose,
  title,
  subtitle,
  content,
  saveButton,
  cancelButton,
  deleteButton,
  snapPoints = ["85%"],
}: DrawerWithLayoutProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const hasFooter = saveButton || cancelButton || deleteButton;

  return (
    <BottomSheetDrawer
      visible={visible}
      onClose={onClose}
      snapPoints={snapPoints}
    >
      <View style={styles.wrapper}>
        <Box className="px-6 pt-2 pb-4">
          <HStack className="mb-1 items-center justify-between">
            <Text
              className="text-2xl font-bold flex-1"
              style={{ color: theme.textPrimary }}
            >
              {title}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="cursor-pointer"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  color: theme.textSecondary,
                  fontWeight: "300",
                }}
              >
                ×
              </Text>
            </TouchableOpacity>
          </HStack>
          <Text
            className="mt-1 text-sm"
            style={{ color: theme.textSecondary }}
          >
            {subtitle}
          </Text>
        </Box>

        <BottomSheetScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: hasFooter ? FOOTER_MIN_HEIGHT : 16,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </BottomSheetScrollView>

        {hasFooter && (
          <View
            style={[
              styles.footer,
              {
                borderTopColor: theme.cardBorder,
                backgroundColor: theme.cardBg,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <VStack className="gap-3">
              {deleteButton && (
                <TouchableOpacity
                  onPress={deleteButton.onPress}
                  disabled={deleteButton.disabled}
                  activeOpacity={0.7}
                  className="cursor-pointer"
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: isDark ? "#7f1d1d" : "#fef2f2",
                    borderWidth: 1,
                    borderColor: isDark ? "#991b1b" : "#fee2e2",
                    opacity: deleteButton.disabled ? 0.5 : 1,
                  }}
                >
                  {deleteButton.loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text
                      className="text-center text-base font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      {deleteButton.label}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              {cancelButton && (
                <TouchableOpacity
                  onPress={cancelButton.onPress}
                  disabled={cancelButton.disabled}
                  activeOpacity={0.7}
                  className="cursor-pointer"
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    opacity: cancelButton.disabled ? 0.5 : 1,
                  }}
                >
                  <Text
                    className="text-center text-base font-semibold"
                    style={{ color: theme.textSecondary }}
                  >
                    {cancelButton.label}
                  </Text>
                </TouchableOpacity>
              )}
              {saveButton && (
                <Button
                  onPress={saveButton.onPress}
                  disabled={saveButton.disabled}
                  action="primary"
                  variant="solid"
                  size="lg"
                  className="h-14 cursor-pointer rounded-2xl"
                  style={{
                    backgroundColor: saveButton.disabled
                      ? theme.textTertiary
                      : theme.buttonPrimary,
                    shadowColor: saveButton.disabled
                      ? "transparent"
                      : theme.buttonPrimary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: saveButton.disabled ? 0 : 0.3,
                    shadowRadius: 8,
                    elevation: saveButton.disabled ? 0 : 4,
                  }}
                >
                  {saveButton.loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <ButtonText
                      className="text-base font-semibold"
                      style={{ color: "#ffffff" }}
                    >
                      {saveButton.label}
                    </ButtonText>
                  )}
                </Button>
              )}
            </VStack>
          </View>
        )}
      </View>
    </BottomSheetDrawer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
