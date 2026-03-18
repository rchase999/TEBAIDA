import React, { useState, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import {
  Search, Plus, Trash2, Copy, Save, Download, Upload,
  X, User, Palette, Tag, MessageSquare,
} from 'lucide-react';
import { useStore } from '../../store';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Avatar } from '../../components/Avatar';
import { Modal } from '../../components/Modal';
import type { Persona } from '../../../types';

/* ------- default empty persona ------- */

function createEmptyPersona(): Persona {
  return {
    id: uuidv4(),
    name: '',
    tagline: '',
    background: '',
    expertise: [],
    rhetorical_style: '',
    ideological_leanings: '',
    argumentation_preferences: {
      evidence_weight: 'moderate',
      emotional_appeals: 'moderate',
      concession_willingness: 'moderate',
      humor: '',
    },
    debate_behavior: {
      opening_strategy: '',
      rebuttal_strategy: '',
      closing_strategy: '',
    },
    avatar_color: '#6366F1',
  };
}

/* ------- Color presets ------- */
const COLOR_PRESETS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  '#E11D48', '#7C3AED', '#059669', '#D97706', '#2563EB',
];

/* ------- Expertise tag input ------- */
const TagInput: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
}> = ({ tags, onChange }) => {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const newTag = input.trim();
      if (!tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Expertise Tags
      </label>
      <div className={clsx(
        'flex flex-wrap items-center gap-1.5 rounded-lg border bg-white px-3 py-2',
        'dark:bg-surface-dark-1 dark:border-surface-dark-4',
        'border-gray-300 focus-within:border-forge-500 focus-within:ring-2 focus-within:ring-forge-500/30',
      )}>
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-forge-100 px-2.5 py-0.5 text-xs font-medium text-forge-700 dark:bg-forge-900/30 dark:text-forge-300"
          >
            {tag}
            <button
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="rounded-full p-0.5 hover:bg-forge-200 dark:hover:bg-forge-900/50"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Type and press Enter...' : ''}
          className="min-w-[120px] flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
        />
      </div>
    </div>
  );
};

/* ------- Preview ------- */
const PersonaPreview: React.FC<{ persona: Persona }> = ({ persona }) => (
  <Card className="space-y-3">
    <div className="flex items-center gap-3">
      <Avatar name={persona.name || '?'} color={persona.avatar_color} size="lg" />
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{persona.name || 'Unnamed'}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">{persona.tagline || 'No tagline'}</p>
      </div>
    </div>
    {persona.expertise.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {persona.expertise.map((e) => (
          <Badge key={e} variant="info">{e}</Badge>
        ))}
      </div>
    )}
    {persona.background && (
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{persona.background}</p>
    )}
    <div className="grid grid-cols-3 gap-2 text-center text-xs">
      <div className="rounded-lg bg-gray-50 p-2 dark:bg-surface-dark-2">
        <p className="font-medium text-gray-900 dark:text-gray-100">{persona.argumentation_preferences.evidence_weight}</p>
        <p className="text-gray-500 dark:text-gray-400">Evidence</p>
      </div>
      <div className="rounded-lg bg-gray-50 p-2 dark:bg-surface-dark-2">
        <p className="font-medium text-gray-900 dark:text-gray-100">{persona.argumentation_preferences.emotional_appeals}</p>
        <p className="text-gray-500 dark:text-gray-400">Emotion</p>
      </div>
      <div className="rounded-lg bg-gray-50 p-2 dark:bg-surface-dark-2">
        <p className="font-medium text-gray-900 dark:text-gray-100">{persona.argumentation_preferences.concession_willingness}</p>
        <p className="text-gray-500 dark:text-gray-400">Concession</p>
      </div>
    </div>
  </Card>
);

/* ------- Main component ------- */

const PersonaEditor: React.FC = () => {
  const personas = useStore((s) => s.personas);
  const addPersona = useStore((s) => s.addPersona);
  const updatePersona = useStore((s) => s.updatePersona);
  const deletePersona = useStore((s) => s.deletePersona);

  const [selectedId, setSelectedId] = useState<string | null>(personas[0]?.id ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editState, setEditState] = useState<Persona | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const filteredPersonas = useMemo(() => {
    if (!searchQuery.trim()) return personas;
    const q = searchQuery.toLowerCase();
    return personas.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.expertise.some((e) => e.toLowerCase().includes(q)),
    );
  }, [personas, searchQuery]);

  const selectedPersona = useMemo(
    () => personas.find((p) => p.id === selectedId) ?? null,
    [personas, selectedId],
  );

  // When selecting a persona, copy it to edit state
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    const p = personas.find((x) => x.id === id);
    if (p) setEditState({ ...p });
  }, [personas]);

  // Initialize edit state if we have a selection but no edit state
  React.useEffect(() => {
    if (selectedId && !editState) {
      const p = personas.find((x) => x.id === selectedId);
      if (p) setEditState({ ...p });
    }
  }, [selectedId, editState, personas]);

  const handleNew = () => {
    const newP = createEmptyPersona();
    addPersona(newP);
    setSelectedId(newP.id);
    setEditState({ ...newP });
  };

  const handleSave = () => {
    if (!editState) return;
    const exists = personas.find((p) => p.id === editState.id);
    if (exists) {
      updatePersona(editState.id, editState);
    } else {
      addPersona(editState);
    }
  };

  const handleDelete = () => {
    if (!selectedId) return;
    deletePersona(selectedId);
    setShowDeleteModal(false);
    const remaining = personas.filter((p) => p.id !== selectedId);
    if (remaining.length > 0) {
      handleSelect(remaining[0].id);
    } else {
      setSelectedId(null);
      setEditState(null);
    }
  };

  const handleDuplicate = () => {
    if (!editState) return;
    const dup: Persona = {
      ...JSON.parse(JSON.stringify(editState)),
      id: uuidv4(),
      name: editState.name + ' (Copy)',
    };
    addPersona(dup);
    setSelectedId(dup.id);
    setEditState({ ...dup });
  };

  const handleExport = () => {
    if (!editState) return;
    const blob = new Blob([JSON.stringify(editState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `persona-${editState.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText) as Persona;
      if (!parsed.name) throw new Error('Invalid persona');
      const imported: Persona = { ...parsed, id: uuidv4() };
      addPersona(imported);
      setSelectedId(imported.id);
      setEditState({ ...imported });
      setImportModalOpen(false);
      setImportText('');
    } catch {
      alert('Failed to parse persona JSON. Please check the format.');
    }
  };

  const updateField = <K extends keyof Persona>(key: K, value: Persona[K]) => {
    if (!editState) return;
    setEditState({ ...editState, [key]: value });
  };

  const updateArgPref = (key: string, value: string) => {
    if (!editState) return;
    setEditState({
      ...editState,
      argumentation_preferences: { ...editState.argumentation_preferences, [key]: value },
    });
  };

  const updateBehavior = (key: string, value: string) => {
    if (!editState) return;
    setEditState({
      ...editState,
      debate_behavior: { ...editState.debate_behavior, [key]: value },
    });
  };

  return (
    <div className="flex h-full">
      {/* Left: Persona List */}
      <div className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white dark:border-surface-dark-3 dark:bg-surface-dark-0">
        <div className="border-b border-gray-200 p-3 dark:border-surface-dark-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Personas</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setImportModalOpen(true)}>
                <Upload className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNew}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search personas..."
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="flex-1 overflow-auto p-2 space-y-1">
          {filteredPersonas.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className={clsx(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                selectedId === p.id
                  ? 'bg-forge-600/10 text-forge-700 dark:bg-forge-600/20 dark:text-forge-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-surface-dark-2',
              )}
            >
              <Avatar name={p.name || '?'} color={p.avatar_color} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.name || 'Unnamed'}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{p.tagline || 'No tagline'}</p>
              </div>
            </button>
          ))}

          {filteredPersonas.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              {searchQuery ? 'No matching personas' : 'No personas yet'}
            </div>
          )}
        </div>
      </div>

      {/* Right: Editor */}
      {editState ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3 dark:border-surface-dark-3 dark:bg-surface-dark-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {editState.name || 'New Persona'}
            </h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleDuplicate} icon={<Copy className="h-4 w-4" />}>
                Duplicate
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExport} icon={<Download className="h-4 w-4" />}>
                Export
              </Button>
              <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)} icon={<Trash2 className="h-4 w-4" />}>
                Delete
              </Button>
              <Button size="sm" onClick={handleSave} icon={<Save className="h-4 w-4" />}>
                Save
              </Button>
            </div>
          </div>

          {/* Editor form */}
          <div className="flex flex-1 gap-6 overflow-auto p-5">
            <div className="flex-1 space-y-6 max-w-2xl">
              {/* Basic info */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <User className="h-4 w-4" /> Basic Information
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Name"
                    value={editState.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Persona name"
                  />
                  <Input
                    label="Tagline"
                    value={editState.tagline}
                    onChange={(e) => updateField('tagline', e.target.value)}
                    placeholder="Short description"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Background</label>
                  <textarea
                    value={editState.background}
                    onChange={(e) => updateField('background', e.target.value)}
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100 dark:placeholder:text-gray-500"
                    placeholder="Background and experience..."
                  />
                </div>
                <TagInput tags={editState.expertise} onChange={(tags) => updateField('expertise', tags)} />
              </section>

              {/* Style */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <MessageSquare className="h-4 w-4" /> Rhetorical Style
                </h4>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Rhetorical Style</label>
                  <textarea
                    value={editState.rhetorical_style}
                    onChange={(e) => updateField('rhetorical_style', e.target.value)}
                    rows={2}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100 dark:placeholder:text-gray-500"
                    placeholder="How this persona argues..."
                  />
                </div>
                <Input
                  label="Ideological Leanings"
                  value={editState.ideological_leanings}
                  onChange={(e) => updateField('ideological_leanings', e.target.value)}
                  placeholder="Political/philosophical orientation"
                />
              </section>

              {/* Argumentation Preferences */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <Tag className="h-4 w-4" /> Argumentation Preferences
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Select
                    label="Evidence Weight"
                    options={[
                      { value: 'heavy', label: 'Heavy' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'light', label: 'Light' },
                    ]}
                    value={editState.argumentation_preferences.evidence_weight}
                    onChange={(e) => updateArgPref('evidence_weight', e.target.value)}
                  />
                  <Select
                    label="Emotional Appeals"
                    options={[
                      { value: 'heavy', label: 'Heavy' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'minimal', label: 'Minimal' },
                    ]}
                    value={editState.argumentation_preferences.emotional_appeals}
                    onChange={(e) => updateArgPref('emotional_appeals', e.target.value)}
                  />
                  <Select
                    label="Concession Willingness"
                    options={[
                      { value: 'high', label: 'High' },
                      { value: 'moderate', label: 'Moderate' },
                      { value: 'low', label: 'Low' },
                    ]}
                    value={editState.argumentation_preferences.concession_willingness}
                    onChange={(e) => updateArgPref('concession_willingness', e.target.value)}
                  />
                </div>
                <Input
                  label="Humor Style"
                  value={editState.argumentation_preferences.humor}
                  onChange={(e) => updateArgPref('humor', e.target.value)}
                  placeholder="How this persona uses humor"
                />
              </section>

              {/* Debate Behavior */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <MessageSquare className="h-4 w-4" /> Debate Behavior
                </h4>
                {[
                  { key: 'opening_strategy', label: 'Opening Strategy', placeholder: 'How this persona opens a debate...' },
                  { key: 'rebuttal_strategy', label: 'Rebuttal Strategy', placeholder: 'How this persona responds to opponents...' },
                  { key: 'closing_strategy', label: 'Closing Strategy', placeholder: 'How this persona wraps up arguments...' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                    <textarea
                      value={(editState.debate_behavior as any)[field.key]}
                      onChange={(e) => updateBehavior(field.key, e.target.value)}
                      rows={2}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100 dark:placeholder:text-gray-500"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </section>

              {/* Avatar Color */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  <Palette className="h-4 w-4" /> Avatar Color
                </h4>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateField('avatar_color', color)}
                      className={clsx(
                        'h-8 w-8 rounded-full border-2 transition-transform hover:scale-110',
                        editState.avatar_color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent',
                      )}
                      style={{ backgroundColor: color }}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                  <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-gray-300 dark:border-surface-dark-4">
                    <Plus className="h-4 w-4 text-gray-400" />
                    <input
                      type="color"
                      value={editState.avatar_color ?? '#6366F1'}
                      onChange={(e) => updateField('avatar_color', e.target.value)}
                      className="sr-only"
                    />
                  </label>
                </div>
              </section>
            </div>

            {/* Preview panel */}
            <div className="hidden w-80 shrink-0 lg:block">
              <div className="sticky top-0">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Preview</p>
                <PersonaPreview persona={editState} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <User className="mx-auto mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">No persona selected</p>
            <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">Select a persona from the list or create a new one.</p>
            <Button onClick={handleNew} icon={<Plus className="h-4 w-4" />}>Create Persona</Button>
          </div>
        </div>
      )}

      {/* Delete modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Persona">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to delete <strong>{editState?.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>

      {/* Import modal */}
      <Modal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} title="Import Persona (UPP)" size="lg">
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
          Paste a persona JSON (Universal Persona Prompt format) below to import it.
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={10}
          className="mb-4 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 shadow-sm focus:border-forge-500 focus:outline-none focus:ring-2 focus:ring-forge-500/30 dark:border-surface-dark-4 dark:bg-surface-dark-1 dark:text-gray-100"
          placeholder='{ "name": "...", "tagline": "...", ... }'
        />
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setImportModalOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={!importText.trim()} icon={<Upload className="h-4 w-4" />}>Import</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PersonaEditor;
