import React, { useState, useCallback, useMemo, useEffect } from 'react';
import clsx from 'clsx';
import { Save, FolderOpen, Trash2, Tag, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from './Badge';
import { Button } from './Button';
import { Modal } from './Modal';
import { Card } from './Card';
import { Input } from './Input';

/* ======================================================================
   Debate Templates — Save and load debate configurations
   ====================================================================== */

const STORAGE_KEY = 'debateforge-templates';

export interface DebateTemplate {
  id: string;
  name: string;
  topic: string;
  format: string; // 'oxford-union' | 'lincoln-douglas' | 'parliamentary'
  debaterConfigs: Array<{
    position: string;
    modelId: string;
    modelDisplayName: string;
    personaId: string;
    personaName: string;
  }>;
  tags: string[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// useDebateTemplates hook
// ---------------------------------------------------------------------------

export function useDebateTemplates() {
  const [templates, setTemplates] = useState<DebateTemplate[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as DebateTemplate[]) : [];
    } catch {
      return [];
    }
  });

  // Persist whenever templates change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }, [templates]);

  const addTemplate = useCallback((template: DebateTemplate) => {
    setTemplates((prev) => [template, ...prev]);
  }, []);

  const removeTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTemplateById = useCallback(
    (id: string) => templates.find((t) => t.id === id) ?? null,
    [templates],
  );

  return { templates, addTemplate, removeTemplate, getTemplateById };
}

// ---------------------------------------------------------------------------
// SaveTemplateButton
// ---------------------------------------------------------------------------

interface SaveTemplateButtonProps {
  topic: string;
  format: string;
  debaters: any[];
  onSave: (template: DebateTemplate) => void;
}

export const SaveTemplateButton: React.FC<SaveTemplateButtonProps> = ({
  topic,
  format,
  debaters,
  onSave,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleOpen = () => {
    setName('');
    setTagInput('');
    setTags([]);
    setIsOpen(true);
  };

  const handleAddTag = (raw: string) => {
    const value = raw.trim().toLowerCase();
    if (value && !tags.includes(value)) {
      setTags((prev) => [...prev, value]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const template: DebateTemplate = {
      id: uuidv4(),
      name: name.trim(),
      topic,
      format,
      debaterConfigs: debaters.map((d) => ({
        position: d.position ?? '',
        modelId: d.modelId ?? '',
        modelDisplayName: d.modelDisplayName ?? d.modelName ?? '',
        personaId: d.personaId ?? '',
        personaName: d.personaName ?? '',
      })),
      tags,
      createdAt: new Date().toISOString(),
    };

    onSave(template);
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        icon={<Save className="h-4 w-4" />}
        onClick={handleOpen}
      >
        Save as Template
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Save Debate Template">
        <div className="space-y-4">
          {/* Template name */}
          <Input
            label="Template Name"
            placeholder="e.g. AI Ethics — Oxford Union"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          {/* Topic (read-only) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Topic
            </label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-surface-dark-4 dark:bg-surface-dark-2 dark:text-gray-300">
              {topic || '(none)'}
            </p>
          </div>

          {/* Format */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Format
            </label>
            <Badge variant="info" size="md">{format}</Badge>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-surface-dark-4 dark:bg-surface-dark-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-forge-100 px-2 py-0.5 text-xs font-medium text-forge-700 dark:bg-forge-900/30 dark:text-forge-300"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-forge-200 dark:hover:bg-forge-800/40"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput.trim() && handleAddTag(tagInput)}
                placeholder={tags.length === 0 ? 'Add tags...' : ''}
                className="min-w-[80px] flex-1 border-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Debaters summary */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Debaters ({debaters.length})
            </label>
            <div className="space-y-1">
              {debaters.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-sm dark:bg-surface-dark-2"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {d.position ?? `Position ${i + 1}`}
                  </span>
                  <span className="text-gray-400">-</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {d.modelDisplayName ?? d.modelName ?? 'Unknown model'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Save className="h-4 w-4" />}
              onClick={handleSave}
              disabled={!name.trim()}
            >
              Save Template
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ---------------------------------------------------------------------------
// TemplateSelector
// ---------------------------------------------------------------------------

const FORMAT_LABELS: Record<string, string> = {
  'oxford-union': 'Oxford Union',
  'lincoln-douglas': 'Lincoln-Douglas',
  parliamentary: 'Parliamentary',
};

interface TemplateSelectorProps {
  templates: DebateTemplate[];
  onSelect: (template: DebateTemplate) => void;
  onDelete: (id: string) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  onSelect,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.topic.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q)),
    );
  }, [templates, search]);

  const handleSelect = (template: DebateTemplate) => {
    onSelect(template);
    setIsOpen(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete(id);
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        icon={<FolderOpen className="h-4 w-4" />}
        onClick={() => {
          setSearch('');
          setIsOpen(true);
        }}
      >
        Load Template
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Load Debate Template"
        size="lg"
      >
        <div className="space-y-4">
          {/* Search */}
          <Input
            placeholder="Search templates by name, topic, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          {/* Template list */}
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {templates.length === 0
                ? 'No saved templates yet. Save your first debate configuration!'
                : 'No templates match your search.'}
            </div>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
              {filtered.map((template) => (
                <Card key={template.id} hover onClick={() => handleSelect(template)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {/* Name & format */}
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {template.name}
                        </h3>
                        <Badge variant="info" size="sm">
                          {FORMAT_LABELS[template.format] ?? template.format}
                        </Badge>
                      </div>

                      {/* Topic */}
                      <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-400">
                        {template.topic}
                      </p>

                      {/* Debaters */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.debaterConfigs.map((d, i) => (
                          <Badge key={i} size="sm">
                            {d.position}: {d.modelDisplayName || d.modelId}
                          </Badge>
                        ))}
                      </div>

                      {/* Tags */}
                      {template.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          <Tag className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                          {template.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-forge-100 px-2 py-0.5 text-xs font-medium text-forge-700 dark:bg-forge-900/30 dark:text-forge-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Created date */}
                      <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                        Created {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDelete(e, template.id)}
                      className="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
