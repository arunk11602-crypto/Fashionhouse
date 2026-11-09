import { useState, type FormEvent } from 'react';
import { createFlashNews, updateFlashNews, type FlashNews, type FlashNewsInput } from '@/lib/flash-news';
import { useLanguage } from '@/lib/language';

interface FlashNewsFormProps {
  initial: FlashNews | null;
  onCancel: () => void;
  onSaved: (message: string) => void;
}

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function FlashNewsForm({ initial, onCancel, onSaved }: FlashNewsFormProps) {
  const { t } = useLanguage();
  const [textEn, setTextEn] = useState(initial?.text.en ?? '');
  const [textHi, setTextHi] = useState(initial && initial.text.hi !== initial.text.en ? initial.text.hi : '');
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.endsAt ?? null));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [isPinned, setIsPinned] = useState(initial?.isPinned ?? false);
  const [textColor, setTextColor] = useState(initial?.textColor ?? '#ffffff');
  const [backgroundColor, setBackgroundColor] = useState(initial?.backgroundColor ?? '#7a1f2b');
  const [linkUrl, setLinkUrl] = useState(initial?.linkUrl ?? '');
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const validate = (): string[] => {
    const problems: string[] = [];
    if (!textEn.trim()) {
      problems.push(t({ en: 'Enter the news text in English.', hi: 'अंग्रेज़ी में समाचार लिखें।' }));
    } else if (textEn.trim().length > 200 || textHi.trim().length > 200) {
      problems.push(t({ en: 'News text must be 200 characters or fewer.', hi: 'समाचार 200 अक्षरों से कम रखें।' }));
    }
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      problems.push(t({ en: 'End date must be after the start date.', hi: 'समाप्ति तिथि शुरू होने की तारीख के बाद होनी चाहिए।' }));
    }
    if (!HEX_PATTERN.test(textColor) || !HEX_PATTERN.test(backgroundColor)) {
      problems.push(t({ en: 'Choose valid colours.', hi: 'मान्य रंग चुनें।' }));
    }
    if (linkUrl.trim() && !/^https?:\/\/\S+$/i.test(linkUrl.trim())) {
      problems.push(t({ en: 'Link must start with http:// or https://', hi: 'लिंक http:// या https:// से शुरू होना चाहिए।' }));
    }
    return problems;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problems = validate();
    setErrors(problems);
    setSaveError(null);
    if (problems.length > 0) return;

    const input: FlashNewsInput = {
      textEn,
      textHi,
      isActive,
      isPinned,
      startsAt: fromLocalInput(startsAt),
      endsAt: fromLocalInput(endsAt),
      textColor,
      backgroundColor,
      linkUrl: linkUrl.trim() || null,
    };

    setSaving(true);
    try {
      if (initial) {
        await updateFlashNews(initial.id, input);
        onSaved(t({ en: 'Flash news updated.', hi: 'फ्लैश न्यूज़ अपडेट हो गई।' }));
      } else {
        await createFlashNews(input);
        onSaved(t({ en: 'Flash news added.', hi: 'फ्लैश न्यूज़ जोड़ दी गई।' }));
      }
    } catch {
      setSaveError(
        t({
          en: 'Could not save. Check your connection and try again.',
          hi: 'सेव नहीं हो सका। इंटरनेट जाँचकर फिर से कोशिश करें।',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="news-text-en" className="label">
          {t({ en: 'News text (English)', hi: 'समाचार (अंग्रेज़ी)' })}
        </label>
        <input
          id="news-text-en"
          className="field"
          maxLength={200}
          value={textEn}
          onChange={(event) => setTextEn(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="news-text-hi" className="label">
          {t({ en: 'News text (Hindi, optional)', hi: 'समाचार (हिंदी, वैकल्पिक)' })}
        </label>
        <input
          id="news-text-hi"
          className="field"
          maxLength={200}
          value={textHi}
          onChange={(event) => setTextHi(event.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="news-starts" className="label">
            {t({ en: 'Show from (optional)', hi: 'इस तारीख से दिखाएँ (वैकल्पिक)' })}
          </label>
          <input
            id="news-starts"
            type="datetime-local"
            className="field"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="news-ends" className="label">
            {t({ en: 'Show until (optional)', hi: 'इस तारीख तक दिखाएँ (वैकल्पिक)' })}
          </label>
          <input
            id="news-ends"
            type="datetime-local"
            className="field"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="news-text-color" className="label">
            {t({ en: 'Text colour', hi: 'लिखावट का रंग' })}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="news-text-color"
              type="color"
              className="h-12 w-14 cursor-pointer rounded-xl border border-maroon-100 bg-white p-1"
              value={textColor}
              onChange={(event) => setTextColor(event.target.value)}
            />
            <span className="font-mono text-base text-maroon-700">{textColor}</span>
          </div>
        </div>
        <div>
          <label htmlFor="news-bg-color" className="label">
            {t({ en: 'Background colour', hi: 'पृष्ठभूमि का रंग' })}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="news-bg-color"
              type="color"
              className="h-12 w-14 cursor-pointer rounded-xl border border-maroon-100 bg-white p-1"
              value={backgroundColor}
              onChange={(event) => setBackgroundColor(event.target.value)}
            />
            <span className="font-mono text-base text-maroon-700">{backgroundColor}</span>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-center rounded-xl px-4 py-3 text-center text-lg font-semibold"
        style={{ color: textColor, backgroundColor }}
        aria-label={t({ en: 'Preview', hi: 'पूर्वावलोकन' })}
      >
        {textEn.trim() || t({ en: 'Preview of your news', hi: 'आपके समाचार का पूर्वावलोकन' })}
      </div>

      <div>
        <label htmlFor="news-link" className="label">
          {t({ en: 'Link (optional)', hi: 'लिंक (वैकल्पिक)' })}
        </label>
        <input
          id="news-link"
          type="url"
          className="field"
          placeholder="https://"
          value={linkUrl}
          onChange={(event) => setLinkUrl(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        <label className="flex items-center gap-3 text-lg text-maroon-800">
          <input
            type="checkbox"
            className="h-5 w-5 accent-maroon-700"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
          {t({ en: 'Active (show on website)', hi: 'सक्रिय (वेबसाइट पर दिखाएँ)' })}
        </label>
        <label className="flex items-center gap-3 text-lg text-maroon-800">
          <input
            type="checkbox"
            className="h-5 w-5 accent-maroon-700"
            checked={isPinned}
            onChange={(event) => setIsPinned(event.target.checked)}
          />
          {t({ en: 'Pin to the front', hi: 'सबसे आगे पिन करें' })}
        </label>
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 rounded-xl bg-red-50 px-4 py-3 text-base text-red-800">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {saveError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-800">
          {saveError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="btn-outline" disabled={saving}>
          {t({ en: 'Cancel', hi: 'रद्द करें' })}
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving
            ? t({ en: 'Saving...', hi: 'सेव हो रहा है...' })
            : initial
              ? t({ en: 'Save changes', hi: 'बदलाव सेव करें' })
              : t({ en: 'Add news', hi: 'समाचार जोड़ें' })}
        </button>
      </div>
    </form>
  );
}
