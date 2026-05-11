import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView,
} from 'react-native';
import { FORMATS, IMAGE_OUTPUT_FORMATS, QUALITIES_VIDEO, QUALITIES_AUDIO, QUALITIES_IMAGE, AUDIO_FORMAT_IDS } from '@yoink/shared';
import { T } from '../../styles/tokens';
import { useFileConvert } from '../../hooks/useFileConvert';
import { useToast } from '../../components/Toast';
import FormatPicker from '../../components/FormatPicker';
import QualityPicker from '../../components/QualityPicker';
import ProgressBar from '../../components/ProgressBar';

function formatsFor(type: string) {
  if (type === 'image') return IMAGE_OUTPUT_FORMATS;
  if (type === 'audio') return FORMATS.filter((f) => AUDIO_FORMAT_IDS.has(f.id));
  return FORMATS.filter((f) => f.kind === 'video' || AUDIO_FORMAT_IDS.has(f.id));
}

function qualitiesFor(type: string, fmt: string): readonly string[] {
  if (type === 'image') return QUALITIES_IMAGE;
  if (AUDIO_FORMAT_IDS.has(fmt)) return QUALITIES_AUDIO;
  return QUALITIES_VIDEO;
}

export default function ConvertScreen() {
  const { state, setFmt, setQuality, pickFile, convert, share, reset } = useFileConvert();
  const { toast } = useToast();

  React.useEffect(() => {
    if (state.stage === 'done') toast('Converted! Tap share to save.', 'success');
    if (state.stage === 'error' && state.error) toast(state.error, 'error');
  }, [state.stage]);

  const formats = formatsFor(state.inputType);
  const qualities = qualitiesFor(state.inputType, state.fmt);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.heading}>File Converter</Text>
        <Text style={[s.sub, { marginBottom: 20 }]}>Convert video, audio, images and PDFs.</Text>

        {/* File picker */}
        {state.stage === 'idle' ? (
          <TouchableOpacity onPress={pickFile} style={s.dropzone}>
            <Text style={s.dropIcon}>📁</Text>
            <Text style={s.dropTitle}>Pick a file</Text>
            <Text style={s.dropSub}>Video · Audio · Image · PDF</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.fileCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.fileName} numberOfLines={1}>{state.inputName}</Text>
              <Text style={s.fileSub}>{state.inputType}</Text>
            </View>
            {state.stage !== 'converting' && (
              <TouchableOpacity onPress={reset}>
                <Text style={{ color: T.muted, fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {state.stage !== 'idle' && state.stage !== 'converting' && (
          <>
            <Text style={s.sectionLabel}>OUTPUT FORMAT</Text>
            <FormatPicker formats={formats} selected={state.fmt} onChange={setFmt} />
            <Text style={[s.sectionLabel, { marginTop: 16 }]}>QUALITY</Text>
            <QualityPicker qualities={qualities} selected={state.quality} onChange={setQuality} />
          </>
        )}

        <View style={{ flex: 1, minHeight: 24 }} />

        {state.stage === 'converting' && (
          <View style={s.progressCard}>
            <Text style={s.actionTitle}>Converting… {state.progress}%</Text>
            <ProgressBar progress={state.progress} />
          </View>
        )}

        {state.stage === 'done' && (
          <View style={{ gap: 10 }}>
            <TouchableOpacity onPress={share} style={[s.btn, s.primary]}>
              <Text style={s.primaryText}>Share / Save file</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={reset} style={[s.btn, s.ghost]}>
              <Text style={{ color: T.text }}>Convert another</Text>
            </TouchableOpacity>
          </View>
        )}

        {state.stage === 'ready' && (
          <TouchableOpacity onPress={convert} style={[s.btn, s.primary]}>
            <Text style={s.primaryText}>Convert to {state.fmt.toUpperCase()}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:    { padding: 20, paddingBottom: 120, flexGrow: 1 },
  heading:      { fontSize: 26, fontWeight: '700', color: T.text, marginBottom: 6 },
  sub:          { fontSize: 13, color: T.muted },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, color: T.faint, marginBottom: 10, marginTop: 20 },
  dropzone:     { backgroundColor: T.panel, borderRadius: 16, borderWidth: 1, borderColor: T.border, borderStyle: 'dashed', padding: 40, alignItems: 'center', gap: 8, marginBottom: 8 },
  dropIcon:     { fontSize: 32 },
  dropTitle:    { color: T.text, fontSize: 16, fontWeight: '600' },
  dropSub:      { color: T.muted, fontSize: 12 },
  fileCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: T.panel, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: T.border, marginBottom: 8, gap: 12 },
  fileName:     { color: T.text, fontSize: 13, fontWeight: '600' },
  fileSub:      { color: T.muted, fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  progressCard: { backgroundColor: T.panel, borderRadius: 14, padding: 16, gap: 10, borderWidth: 0.5, borderColor: T.border },
  actionTitle:  { color: T.text, fontWeight: '600', fontSize: 14 },
  btn:          { borderRadius: 13, padding: 17, alignItems: 'center' },
  primary:      { backgroundColor: T.accent },
  primaryText:  { color: '#0e1014', fontSize: 15, fontWeight: '700' },
  ghost:        { borderWidth: 0.5, borderColor: T.border, backgroundColor: 'rgba(255,255,255,0.04)' },
});
