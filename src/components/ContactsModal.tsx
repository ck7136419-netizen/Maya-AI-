import React, { useState } from 'react';
import { Users, Phone, Plus, X, Search, UserCheck } from 'lucide-react';
import { Contact, DEFAULT_CONTACTS, executeMakeCall } from '../utils/deviceBridge';

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onAddContact: (contact: Contact) => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onAddContact,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRel, setNewRel] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.relationship?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery)
  );

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    onAddContact({
      id: Date.now().toString(),
      name: newName.trim(),
      phoneNumber: newPhone.trim(),
      relationship: newRel.trim() || undefined,
    });

    setNewName('');
    setNewPhone('');
    setNewRel('');
    setIsAdding(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contacts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-neutral-100 flex flex-col max-h-[85vh]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close contacts modal"
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 id="contacts-modal-title" className="text-xl font-bold">
              Device Contacts Directory
            </h2>
            <p className="text-xs text-neutral-400">
              Queried during voice calls: &quot;Call Mom&quot; or &quot;Rahul ko call karo&quot;
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contact by name or relationship..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:border-rose-500 text-neutral-200"
          />
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 hover:border-neutral-700 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-700 flex items-center justify-center font-bold text-sm text-neutral-200">
                  {c.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    {c.name}
                    {c.relationship && (
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                        {c.relationship}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-400 font-mono">{c.phoneNumber}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => executeMakeCall(c.phoneNumber)}
                title={`Call ${c.name}`}
                aria-label={`Dial ${c.name}`}
                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-sm">
              No contacts found for &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Add Contact Form */}
        {isAdding ? (
          <form onSubmit={handleAddNew} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 mb-3">
            <div className="text-xs font-semibold text-neutral-300">Add New Contact</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Full Name (e.g. Rahul)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="text-xs p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white"
              />
              <input
                type="tel"
                placeholder="Phone (e.g. +919876543210)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
                className="text-xs p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono"
              />
            </div>
            <input
              type="text"
              placeholder="Relationship (optional: e.g. Friend, Brother)"
              value={newRel}
              onChange={(e) => setNewRel(e.target.value)}
              className="w-full text-xs p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-white"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-medium"
              >
                Save Contact
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="mb-3 py-2 px-3 border border-dashed border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Contact
          </button>
        )}

        <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            Safe contacts allowlist active
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
