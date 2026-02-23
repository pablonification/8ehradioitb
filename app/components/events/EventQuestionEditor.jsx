"use client";

function toQuestionKey(label) {
  return label
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

export default function EventQuestionEditor({ questions, onChange }) {
  const handleUpdate = (index, updates) => {
    const nextQuestions = questions.map((question, questionIndex) =>
      questionIndex === index ? { ...question, ...updates } : question,
    );
    onChange(nextQuestions);
  };

  const handleAdd = () => {
    onChange([
      ...questions,
      {
        key: "",
        label: "",
        fieldType: "text",
        required: false,
        options: [],
      },
    ]);
  };

  const handleRemove = (index) => {
    onChange(questions.filter((_, questionIndex) => questionIndex !== index));
  };

  return (
    <div className="space-y-3">
      {questions.length === 0 ? (
        <p className="text-sm text-gray-600">No custom questions added yet.</p>
      ) : null}

      {questions.map((question, index) => {
        const showOptions =
          question.fieldType === "select" || question.fieldType === "checkbox";
        const optionValue = Array.isArray(question.options)
          ? question.options.join(", ")
          : typeof question.options === "string"
            ? question.options
            : "";

        return (
          <div
            key={`question-${index}`}
            className="border border-gray-200 rounded-lg p-4 space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Label
                </label>
                <input
                  type="text"
                  value={question.label}
                  onChange={(event) => {
                    const label = event.target.value;
                    handleUpdate(index, {
                      label,
                      key: toQuestionKey(label),
                    });
                  }}
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="Why do you want to join?"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Field Type
                </label>
                <select
                  value={question.fieldType}
                  onChange={(event) =>
                    handleUpdate(index, { fieldType: event.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <option value="text">text</option>
                  <option value="textarea">textarea</option>
                  <option value="number">number</option>
                  <option value="date">date</option>
                  <option value="select">select</option>
                  <option value="checkbox">checkbox</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean(question.required)}
                  onChange={(event) =>
                    handleUpdate(index, { required: event.target.checked })
                  }
                />
                Required
              </label>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>

            {showOptions ? (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Options (comma-separated)
                </label>
                <input
                  type="text"
                  value={optionValue}
                  onChange={(event) => {
                    const options = event.target.value
                      .split(",")
                      .map((option) => option.trim())
                      .filter(Boolean);
                    handleUpdate(index, { options });
                  }}
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="Option A, Option B"
                />
              </div>
            ) : null}
          </div>
        );
      })}

      <button
        type="button"
        data-testid="question-add-button"
        onClick={handleAdd}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
      >
        Add Question
      </button>
    </div>
  );
}
