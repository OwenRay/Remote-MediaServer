import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

import { useGetModulesQuery, useGetSettingsQuery, useUpdateSettingsMutation, SettingsAttributes } from '@/src/services/api/settings';
import {ThemedPicker} from "@/src/components/form/ThemedPicker";

function CheckboxRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (next: boolean) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

function TextRow({ label, value, onChangeText, keyboardType = 'default' as const, placeholder }: { label: string; value: string; placeholder?: string; keyboardType?: 'default' | 'numeric' | 'email-address'; onChangeText: (t: string) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      <TextInput
        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
        value={value ?? ''}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.border}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useTheme();
  const { data: settings, isFetching } = useGetSettingsQuery();
  const { data: availableModules } = useGetModulesQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [draft, setDraft] = useState<SettingsAttributes | undefined>(undefined);

  useEffect(() => {
    if (settings && !draft) setDraft(settings);
  }, [settings, draft]);

  const hasModule = (name: string) => (draft?.modules ?? []).includes(name);

  const toggleModule = (name: string) => {
    if (!draft) return;
    const set = new Set(draft.modules ?? []);
    if (set.has(name)) set.delete(name); else set.add(name);
    setDraft({ ...draft, modules: Array.from(set) });
  };

  const onSave = async () => {
    if (!draft) return;
    try {
      const patch: Partial<SettingsAttributes> = {
        name: draft.name,
        port: Number(draft.port) as any,
        filewatcher: draft.filewatcher,
        startscan: !!draft.startscan,
        modules: draft.modules ?? [],
        // Conditional blocks
        ssldomain: draft.ssldomain,
        sslport: draft.sslport ? Number(draft.sslport) : undefined,
        sslemail: draft.sslemail,
        sslredirect: draft.sslredirect,
        sharehost: draft.sharehost,
        shareport: draft.shareport ? Number(draft.shareport) : undefined,
        sharespace: draft.sharespace ? Number(draft.sharespace) : undefined,
        libraries: draft.libraries ?? [],
        advanced: !!draft.advanced,
      };
      await updateSettings(patch).unwrap();
      if (Platform.OS === 'web') alert('Settings saved'); else Alert.alert('Settings', 'Settings saved');
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') alert('Failed to save settings'); else Alert.alert('Settings', 'Failed to save settings');
    }
  };

  if (!draft) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: theme.colors.text }}>{isFetching ? 'Loading...' : 'No settings'}</Text></View>;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ alignItems: 'flex-end' }}>
          <Pressable onPress={onSave} style={[styles.saveBtn, { backgroundColor: theme.colors.card }]} accessibilityLabel="save">
            <Text style={{ color: theme.colors.text }}>{isSaving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Server settings</Text>
          <TextRow label="Server name" value={draft.name ?? ''} onChangeText={(t) => setDraft({ ...draft, name: t })} />
          <TextRow label="Port" value={String(draft.port ?? '')} keyboardType="numeric" onChangeText={(t) => setDraft({ ...draft, port: Number(t) as any })} />
          <View style={styles.row}>
            <Text style={[styles.label, { color: theme.colors.text }]}>File watcher</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => setDraft({ ...draft, filewatcher: 'native' })} style={[styles.pill, draft.filewatcher === 'native' && styles.pillActive]}><Text style={styles.pillText}>Native</Text></Pressable>
              <Pressable onPress={() => setDraft({ ...draft, filewatcher: 'polling' })} style={[styles.pill, draft.filewatcher === 'polling' && styles.pillActive]}><Text style={styles.pillText}>Polling</Text></Pressable>
            </View>
          </View>
          <CheckboxRow label="Full rescan on start" value={!!draft.startscan} onValueChange={(v) => setDraft({ ...draft, startscan: v })} />
        </View>

        <View style={styles.rowRight}>
          <CheckboxRow label="Show advanced" value={!!draft.advanced} onValueChange={(v) => setDraft({ ...draft, advanced: v })} />
        </View>

        {hasModule('ssl') && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>SSL</Text>
            <TextRow label="SSL Subdomain" value={draft.ssldomain ?? ''} onChangeText={(t) => setDraft({ ...draft, ssldomain: t })} />
            <TextRow label="SSL port" value={draft.sslport ? String(draft.sslport) : ''} keyboardType="numeric" onChangeText={(t) => setDraft({ ...draft, sslport: Number(t) as any })} />
            <TextRow label="Email" value={draft.sslemail ?? ''} keyboardType="email-address" onChangeText={(t) => setDraft({ ...draft, sslemail: t })} />
            <CheckboxRow label="Automatically redirect to https" value={!!draft.sslredirect} onValueChange={(v) => setDraft({ ...draft, sslredirect: v })} />
          </View>
        )}

        {hasModule('sharing') && (
          <View style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Share settings</Text>
            <TextRow label="Sharing host" value={draft.sharehost ?? ''} onChangeText={(t) => setDraft({ ...draft, sharehost: t })} />
            <TextRow label="Sharing port" value={draft.shareport ? String(draft.shareport) : ''} keyboardType="numeric" onChangeText={(t) => setDraft({ ...draft, shareport: Number(t) as any })} />
            <View style={styles.column}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Space reserved for shared files ({draft.sharespace ?? 0})</Text>
              <Slider
                minimumValue={1}
                maximumValue={1000}
                step={1}
                value={draft.sharespace ?? 1}
                onValueChange={(v) => setDraft({ ...draft, sharespace: Math.round(v) })}
              />
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Share key</Text>
              <Text selectable style={[styles.mono, { color: theme.colors.text }]}>{`${draft.sharekey ?? ''}-${draft.dbKey ?? ''}-${draft.dbNonce ?? ''}`}</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Media libraries</Text>
          {(draft.libraries ?? []).map((lib, idx) => (
            <View key={lib.uuid ?? `idx-${idx}`} style={[styles.row, styles.libRow]}>
              <TextInput
                style={[styles.input, { flex: 1, color: theme.colors.text, borderColor: theme.colors.border }]}
                placeholder="Name"
                placeholderTextColor={theme.colors.border}
                value={lib.name ?? ''}
                onChangeText={(t) => {
                  const libs = [...(draft.libraries ?? [])];
                  libs[idx] = { ...libs[idx], name: t };
                  setDraft({ ...draft, libraries: libs });
                }}
              />
                <ThemedPicker
                  selectedValue={lib.type ?? 'folder'}
                  onValueChange={(val) => {
                    const libs = [...(draft.libraries ?? [])];
                    libs[idx] = { ...libs[idx], type: String(val) };
                    setDraft({ ...draft, libraries: libs });
                  }}
                >
                  <Picker.Item label="Unspecified" value="folder" />
                  <Picker.Item label="TV Shows" value="tv" />
                  <Picker.Item label="Movies" value="movie" />
                  <Picker.Item label="Music" value="library_music" />
                  <Picker.Item label="External Library" value="shared" />
                </ThemedPicker>
              {(lib.type === 'shared') ? (
                <TextInput
                  style={[styles.input, { flex: 1, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Code"
                  placeholderTextColor={theme.colors.border}
                  value={(lib as any).uuid ?? ''}
                  onChangeText={(t) => {
                    const libs = [...(draft.libraries ?? [])];
                    libs[idx] = { ...libs[idx], uuid: t };
                    setDraft({ ...draft, libraries: libs });
                  }}
                />
              ) : (
                <TextInput
                  style={[styles.input, { flex: 1, color: theme.colors.text, borderColor: theme.colors.border }]}
                  placeholder="Directory"
                  placeholderTextColor={theme.colors.border}
                  value={lib.folder ?? ''}
                  onChangeText={(t) => {
                    const libs = [...(draft.libraries ?? [])];
                    libs[idx] = { ...libs[idx], folder: t };
                    setDraft({ ...draft, libraries: libs });
                  }}
                />
              )}
              <Pressable style={[styles.removeBtn, { borderColor: theme.colors.border }]} onPress={() => {
                const libs = [...(draft.libraries ?? [])];
                libs.splice(idx, 1);
                setDraft({ ...draft, libraries: libs });
              }}>
                <Text style={{ color: theme.colors.text }}>Delete</Text>
              </Pressable>
            </View>
          ))}
          <View style={{ alignItems: 'flex-start' }}>
            <Pressable style={[styles.addBtn, { borderColor: theme.colors.border }]} onPress={() => setDraft({ ...draft, libraries: [...(draft.libraries ?? []), { name: '', type: 'folder', folder: '' }] })}>
              <Text style={{ color: theme.colors.text }}>Add new</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Modules</Text>
          {(availableModules ?? []).map((m) => (
            <CheckboxRow key={m} label={`${m.replace('_', ' ')}`} value={hasModule(m)} onValueChange={() => toggleModule(m)} />
          ))}
          <Text style={[styles.help, { color: theme.colors.text }]}>Changing these requires a restart of the mediaserver</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  rowRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginBottom: 12 },
  column: { gap: 8, marginBottom: 12 },
  card: { borderRadius: 8, padding: 12, marginBottom: 16, borderWidth: StyleSheet.hairlineWidth },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  label: { fontSize: 16 },
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, minWidth: 120 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  pillActive: { backgroundColor: '#444' },
  pillText: { color: 'white', fontWeight: '600' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  removeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth },
  libRow: { gap: 8 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), fontSize: 12 },
  help: { fontSize: 12, opacity: 0.8 },
});
