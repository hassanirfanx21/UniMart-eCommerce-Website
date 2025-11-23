"use client";

import { useEffect } from 'react';

export default function RemoveExtensionNode() {
  useEffect(() => {
    try {
      const el = document.getElementById('elang_linkidin_extension');
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
        // optional: also remove any classes/attributes that extension added
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return null;
}
