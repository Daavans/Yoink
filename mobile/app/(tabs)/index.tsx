import React from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { FORMATS, QUALITIES_VIDEO, QUALITIES_AUDIO, AUDIO_FORMAT_IDS } from '@yoink/shared';
import { T } from '../../styles/tokens';
import { useYouTubeDownload } from '../../hooks/useYouTubeDownload';
import { useToast } from '../../components/Toast';
import VideoCard from '../../components/VideoCard';
import FormatPicker from '../../components/FormatPicker';
import QualityPicker from '../../components/QualityPicker';
import ProgressBar from '../../components/ProgressBar';

const IS_FULL = process.env.EXPO_PUBLIC_VARIANT === 'full';

function PlayStoreBanner() {
  return (
    <View style={s.banner}>
      <Text style={s.bannerTitle}>YouTube downloading unavailable</Text>
      <Text style={s.bannerBody}>
        This Play Store version doesn't include YouTube downloading due to platform policies.
      </Text>
      <TouchableOpacity
        style={s.bannerBtn}
        onPress={() => Linking.openURL('https://github.com/Daavans/YoutubeConverter/releases')}
      >
        <Text style={s.bannerBtnText}>Download the full version →</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function YouTubeScreen() {
  const { state, setUrl, setFmt, setQuality, sniff, download, cancel, reset } = useYouTubeDownload();
  const { toast } = useToast();
  const isAudio = AUDIO_FORMAT_IDS.has(state.fmt);
  const qualities = isAudio ? [...QUALITIES_AUDIO] : [...QUALITIES_VIDEO];

  React.useEffect(() => {
    if (state.stage === 'done') toast('Saved to your gallery!', 'success');
    if (state.stage === 'error' && state.error) toast(state.error, 'error');
  }, [state.stage]);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setUrl(text.trim());
      sniff();
    }
  };

  if (!IS_FULL) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <PlayStoreBanner />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Text style={s.heading}>What are we{'\n'}yoinking today?</Text>
        <Text style={[s.sub, { marginBottom: 20 }]}>Paste a YouTube link below.</Text>

        {/* URL Input */}
        <View style={s.inputRow}>
          <TextInput
            value={state.url}
            onChangeText={(t) => { setUrl(t); }}
            onSubmitEditing={sniff}
            placeholder="Paste a video link…"
            placeholderTextColor={T.faint}
            autoCapitalize="none"
            autoCorrect={false}
            style={[s.input, { color: T.text }]}
          />
          <TouchableOpacity onPress={handlePaste} style={s.pasteBtn}>
            <Text style={{ color: T.text, fontSize: 12 }}>Paste</Text>
          </TouchableOpacity>
        </View>

        {state.stage === 'sniffing' && (
          <Text style={[s.sub, { marginBottom: 16 }]}>Fetching metadata…</Text>
        )}

        {state.meta && <VideoCard meta={state.meta} />}

        {(state.stage === 'ready' || state.stage === 'downloading' || state.stage === 'converting' || state.stage === 'done') && (
          <>
            <Text style={s.sectionLabel}>FORMAT</Text>
            <FormatPicker
              formats={FORMATS}
              selected={state.fmt}
              onChange={(f) => { setFmt(f); setQuality(AUDIO_FORMAT_IDS.has(f) ? '320 kbps' : '720p'); }}
            />
            <Text style={[s.sectionLabel, { marginTop: 16 }]}>{isAudio ? 'BITRATE' : 'RESOLUTION'}</Text>
            <QualityPicker qualities={qualities} selected={state.quality} onChange={setQuality} />
          </>
        )}

        <View style={{ flex: 1, minHeight: 24 }} />

        {/* Action bar */}
        {state.stage === 'downloading' || state.stage === 'converting' ? (
          <View style={s.actionCard}>
            <Text style={s.actionTitle}>
              {state.stage === 'converting' ? 'Converting…' : `Downloading… ${state.progress}%`}
            </Text>
            <ProgressBar progress={state.progress} />
            <TouchableOpacity onPress={cancel} style={[s.btn, s.ghost, { marginTop: 12 }]}>
              <Text style={{ color: T.text }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : state.stage === 'done' ? (
          <View style={s.actionCard}>
            <Text style={s.actionTitle}>Saved to gallery ✓</Text>
            <TouchableOpacity onPress={reset} style={[s.btn, s.primary]}>
              <Text style={s.primaryText}>New download</Text>
            </TouchableOpacity>
          </View>
        ) : state.stage === 'ready' || state.meta ? (
          <TouchableOpacity onPress={download} style={[s.btn, s.primary]}>
            <Text style={s.primaryText}>Yoink as {state.fmt.toUpperCase()} · {state.quality}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:   { padding: 20, paddingBottom: 120, flexGrow: 1 },
  heading:     { fontSize: 26, fontWeight: '700', color: T.text, lineHeight: 32, marginBottom: 6 },
  sub:         { fontSize: 13, color: T.muted },
  sectionLabel:{ fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: T.faint, marginBottom: 10, marginTop: 20 },
  inputRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: T.panel, borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 0.5, borderColor: T.border, gap: 10 },
  input:       { flex: 1, fontSize: 13 },
  pasteBtn:    { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)' },
  actionCard:  { backgroundColor: T.panel, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: T.border, gap: 8 },
  actionTitle: { color: T.text, fontWeight: '600', fontSize: 14 },
  btn:         { borderRadius: 13, padding: 17, alignItems: 'center' },
  primary:     { backgroundColor: T.accent, marginTop: 8 },
  primaryText: { color: '#0e1014', fontSize: 15, fontWeight: '700' },
  ghost:       { borderWidth: 0.5, borderColor: T.border, backgroundColor: 'rgba(255,255,255,0.04)' },
  // Play Store banner
  banner:      { flex: 1, padding: 28, justifyContent: 'center', gap: 12 },
  bannerTitle: { color: T.text, fontSize: 20, fontWeight: '700' },
  bannerBody:  { color: T.muted, fontSize: 14, lineHeight: 20 },
  bannerBtn:   { backgroundColor: T.accentBg, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: 'rgba(200,255,58,0.3)', alignItems: 'center', marginTop: 8 },
  bannerBtnText: { color: T.accent, fontWeight: '700', fontSize: 14 },
});
