import React from 'react';

type IconName =
  | 'link' | 'paste' | 'download' | 'play' | 'settings' | 'folder' | 'history'
  | 'check' | 'sparkle' | 'scissors' | 'arrowR' | 'x' | 'plus' | 'video'
  | 'audio' | 'image' | 'clock' | 'eye' | 'minus' | 'maximize' | 'minimize' | 'close'
  | 'file' | 'youtube';

const paths: Record<IconName, React.ReactNode> = {
  link:     <><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/></>,
  paste:    <><rect x="7" y="5" width="10" height="14" rx="2"/><path d="M9 5a3 3 0 0 1 6 0"/></>,
  download: <><path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></>,
  play:     <path d="M7 5v14l11-7z" fill="currentColor" stroke="none"/>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></>,
  folder:   <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>,
  history:  <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></>,
  check:    <path d="m5 12 5 5 9-11"/>,
  sparkle:  <path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>,
  scissors: <><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m20 4-12 12"/><path d="m8 8 12 12"/></>,
  arrowR:   <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
  x:        <path d="m6 6 12 12M6 18 18 6"/>,
  plus:     <path d="M12 5v14M5 12h14"/>,
  video:    <><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></>,
  audio:    <><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></>,
  image:    <><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="m21 16-5-5-9 9"/></>,
  clock:    <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  eye:      <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
  minus:    <path d="M5 12h14"/>,
  maximize: <rect x="3" y="3" width="18" height="18" rx="2"/>,
  minimize: <path d="M5 12h14"/>,
  close:    <path d="m6 6 12 12M6 18 18 6"/>,
  file:     <><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></>,
  youtube:  <><rect x="2" y="5" width="20" height="14" rx="3.5"/><path d="M10 9.5 L16 12 L10 14.5 Z" fill="currentColor" stroke="none"/></>,
};

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export default function Icon({ name, size = 16, stroke = 'currentColor', strokeWidth = 1.6, style }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={stroke} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      {paths[name]}
    </svg>
  );
}
