"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSection = findSection;
exports.removeSection = removeSection;
function findSection(sections, sectionId) {
    return sections.find(s => s._id.toString() === sectionId);
}
function removeSection(sections, sectionId) {
    const idx = sections.findIndex(s => s._id.toString() === sectionId);
    if (idx === -1)
        return null;
    return sections.splice(idx, 1)[0];
}
