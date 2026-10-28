import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@/components/app-text";
import { CapsuleCard } from "@/components/capsule-card";
import { DailyNoteCard } from "@/components/daily-note-card";
import { HomeSheet } from "@/components/home-sheet";
import { MailboxCard } from "@/components/mailbox-card";
import { PressableScale } from "@/components/pressable-scale";
import { Screen } from "@/components/screen";
import { Radius, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useSession } from "@/providers/session-provider";

export function MindStorage() {
  const theme = useTheme();
  const { profile } = useSession();
  const [noteOpen, setNoteOpen] = useState(false);
  return <Screen edges={["top"]}>
    <View style={styles.header}><AppText variant="titleLg">마음 보관함</AppText></View>
      {profile && <MailboxCard key={profile.id} userId={profile.id} />}
      {profile && (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="한 줄 기록 작성하기"
          onPress={() => setNoteOpen(true)}
          style={[
            styles.noteMenu,
            { backgroundColor: theme.surface, borderColor: theme.hairline },
          ]}
        >
          <Feather name="edit-3" size={20} color={theme.accent} />
          <View style={styles.noteText}>
            <AppText variant="titleMd">한 줄 기록</AppText>
            <AppText variant="caption" color="steel">
              오늘의 기분과 한 줄을 남겨요
            </AppText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.steel} />
        </PressableScale>
      )}
      {profile && noteOpen && <HomeSheet title="한 줄 기록" onClose={() => setNoteOpen(false)}><DailyNoteCard userId={profile.id} /></HomeSheet>}
      {profile && <CapsuleCard key={`capsule:${profile.id}`} />}
  </Screen>;
}
const styles = StyleSheet.create({
  header: { height: 56, justifyContent: "center" },
  noteMenu: { marginTop: Spacing.xl, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  noteText: { flex: 1 },
});
