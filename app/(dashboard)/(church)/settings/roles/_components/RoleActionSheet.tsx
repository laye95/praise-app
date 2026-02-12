import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { ChurchRole } from "@/services/api/permissionService";
import * as Haptics from "expo-haptics";
import { DrawerWithLayout } from "@/components/ui/DrawerWithLayout";

interface RoleActionSheetProps {
  visible: boolean;
  role: ChurchRole | null;
  onClose: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function RoleActionSheet({
  visible,
  role,
  onClose,
  onDelete,
  isDeleting = false,
}: RoleActionSheetProps) {
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete();
  };

  if (!role) return null;

  return (
    <DrawerWithLayout
      visible={visible && !!role}
      onClose={handleClose}
      title={role.name}
      subtitle=""
      snapPoints={["35%"]}
      content={null}
      deleteButton={{
        label: t("common.delete"),
        onPress: handleDelete,
        disabled: isDeleting,
        loading: isDeleting,
      }}
      cancelButton={{
        label: t("common.cancel"),
        onPress: handleClose,
        disabled: isDeleting,
      }}
    />
  );
}
