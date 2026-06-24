import { useState } from "react";
import { X, Plus, Trash2, BarChart3 } from "lucide-react";

const CreatePollModal = ({ isOpen, onClose, onSubmit }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 10) setOptions([...options, ""]);
  };

  const removeOption = (idx) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== idx));
  };

  const updateOption = (idx, value) => {
    const next = [...options];
    next[idx] = value;
    setOptions(next);
  };

  const handleSubmit = async () => {
    const trimmedQ = question.trim();
    const trimmedOpts = options.map((o) => o.trim()).filter(Boolean);

    if (!trimmedQ) return;
    if (trimmedOpts.length < 2) return;

    setSubmitting(true);
    try {
      await onSubmit({
        question: trimmedQ,
        options: trimmedOpts,
        multipleChoice,
        showVoters,
      });
      // Reset
      setQuestion("");
      setOptions(["", ""]);
      setMultipleChoice(false);
      setShowVoters(false);
      onClose();
    } catch (err) {
      console.error("Poll creation failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid =
    question.trim().length > 0 &&
    options.filter((o) => o.trim()).length >= 2;

  if (!isOpen) return null;

  return (
    <div className="poll-modal-backdrop" onClick={onClose}>
      <div
        className="poll-modal animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="poll-modal-header">
          <div className="poll-modal-title-row">
            <BarChart3 size={22} className="poll-modal-icon" />
            <h3 className="poll-modal-title">Create Poll</h3>
          </div>
          <button className="poll-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="poll-modal-body">
          {/* Question */}
          <div className="poll-field">
            <label className="poll-label">Question</label>
            <input
              type="text"
              className="poll-input"
              placeholder="Ask a question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              autoFocus
            />
          </div>

          {/* Options */}
          <div className="poll-field">
            <label className="poll-label">Options</label>
            <div className="poll-options-list">
              {options.map((opt, idx) => (
                <div key={idx} className="poll-option-row">
                  <span className="poll-option-num">{idx + 1}</span>
                  <input
                    type="text"
                    className="poll-input poll-option-input"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <button
                      className="poll-option-remove"
                      onClick={() => removeOption(idx)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button className="poll-add-option" onClick={addOption}>
                <Plus size={16} />
                Add option
              </button>
            )}
          </div>

          {/* Toggles */}
          <div className="poll-toggles">
            <div className="poll-toggle-row">
              <span className="poll-toggle-label">Allow multiple answers</span>
              <label className="poll-switch">
                <input
                  type="checkbox"
                  checked={multipleChoice}
                  onChange={(e) => setMultipleChoice(e.target.checked)}
                />
                <span className="poll-switch-slider" />
              </label>
            </div>

            <div className="poll-toggle-row">
              <span className="poll-toggle-label">Show who voted</span>
              <label className="poll-switch">
                <input
                  type="checkbox"
                  checked={showVoters}
                  onChange={(e) => setShowVoters(e.target.checked)}
                />
                <span className="poll-switch-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="poll-modal-footer">
          <button className="poll-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="poll-btn-send"
            disabled={!isValid || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Sending..." : "Send Poll"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePollModal;
