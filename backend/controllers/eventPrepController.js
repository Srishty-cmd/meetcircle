const mongoose = require('mongoose');
const EventPrep = require('../models/EventPrep');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are an expert event-planning AI assistant for MeetCircle. Your job is to turn an event name and organizer notes into a practical, actionable event prep package.

Always respond in well-structured Markdown with these sections (use ## headings):
1. **Executive summary** — 2–4 sentences.
2. **Goals & success metrics** — bullet list.
3. **Requirements** — venue, tech/AV, staffing/volunteers, budget areas, legal/permits if relevant.
4. **Blueprint / run-of-show** — phased timeline (weeks before → day-of → post-event).
5. **Stakeholders & roles** — who does what.
6. **Marketing & community** — channels and touchpoints.
7. **Risks & mitigations** — table or bullets.
8. **Checklist** — ordered checklist for the organizer.

Be specific and practical. If information is missing, state reasonable assumptions in italics.`;

function buildDemoBlueprint(eventName, eventDetails) {
  const details = (eventDetails || '').trim() || '_No extra details were provided._';
  return `## Executive summary
This prep pack outlines how to plan and execute **${eventName}**. Use it as a working blueprint; adjust dates and numbers to your context.

## Goals & success metrics
- Deliver a smooth attendee experience from registration to follow-up
- Hit target attendance and engagement (define your KPIs)
- Stay within budget and timeline

## Requirements
- **Venue**: capacity, layout, accessibility, load-in windows
- **Tech / AV**: mics, projectors, Wi‑Fi, backup recordings
- **People**: core team, volunteers, MC, security if needed
- **Budget**: venue, catering, swag, marketing, contingency (~10–15%)

## Blueprint / run-of-show
| Phase | Focus |
|-------|--------|
| 8+ weeks | Theme, budget, venue shortlist, date hold |
| 4–6 weeks | Speakers, sponsors, ticketing, comms plan |
| 2 weeks | Runbook, rehearsal, volunteer briefing |
| Week of | Final AV check, signage, emergency contacts |
| Day-of | Registration flow, timing cues, incident response |
| Post | Thank-you, survey, content recap |

## Stakeholders & roles
- **Owner**: single DRI for decisions
- **Ops**: venue, vendors, day-of logistics
- **Comms**: social, email, partners

## Marketing & community
- Early teaser → registration push → reminder → live updates → recap

## Risks & mitigations
- Low turnout → waitlist, partner cross-promo
- AV failure → backup mics/slides offline
- Overrun schedule → buffer slots, hard stops

## Checklist
- [ ] Budget approved
- [ ] Venue contracted
- [ ] Ticketing live
- [ ] Runbook shared with team
- [ ] Post-event survey ready

---

### Organizer notes (input)
${details}

---

*Demo mode: add \`OPENAI_API_KEY\` to backend \`.env\` for live AI-generated blueprints.*`;
}

async function callOpenAI(chatMessages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: chatMessages,
      temperature: 0.65,
      max_tokens: 4096,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error?.message || res.statusText || 'OpenAI request failed';
    throw new Error(msg);
  }
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from AI');
  return text;
}

const chatPrep = async (req, res) => {
  try {
    const { eventName, eventDetails, messages = [] } = req.body;

    if (!eventName || !String(eventName).trim()) {
      return res.status(400).json({ message: 'Event name is required' });
    }

    const name = String(eventName).trim();
    const details = eventDetails != null ? String(eventDetails) : '';

    let chatMessages = [{ role: 'system', content: SYSTEM_PROMPT }];

    if (!Array.isArray(messages) || messages.length === 0) {
      const userContent = `Event name: ${name}\n\nOrganizer details / context:\n${details || '(none provided)'}\n\nProduce the full event prep package as specified in your system instructions.`;
      chatMessages.push({ role: 'user', content: userContent });
    } else {
      const sanitized = messages
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-24)
        .map((m) => ({ role: m.role, content: m.content }));

      if (sanitized.length === 0) {
        return res.status(400).json({ message: 'Invalid conversation messages' });
      }

      chatMessages = [...chatMessages, ...sanitized];
    }

    let reply;
    let demo = false;

    if (OPENAI_API_KEY) {
      reply = await callOpenAI(chatMessages);
    } else {
      reply = buildDemoBlueprint(name, details);
      demo = true;
    }

    return res.status(200).json({ reply, demo });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Failed to generate event prep',
    });
  }
};

const savePrep = async (req, res) => {
  try {
    const { title, details, blueprint, linkedEventId } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!blueprint || !String(blueprint).trim()) {
      return res.status(400).json({ message: 'Blueprint content is required' });
    }

    let linkedEvent = null;
    if (linkedEventId && linkedEventId !== '') {
      if (!mongoose.Types.ObjectId.isValid(linkedEventId)) {
        return res.status(400).json({ message: 'Invalid linked event id' });
      }
      linkedEvent = linkedEventId;
    }

    const doc = await EventPrep.create({
      title: String(title).trim(),
      details: details != null ? String(details) : '',
      blueprint: String(blueprint).trim(),
      createdBy: req.user._id,
      linkedEvent,
    });

    return res.status(201).json(doc);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to save event prep' });
  }
};

const listMine = async (req, res) => {
  try {
    const list = await EventPrep.find({ createdBy: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('linkedEvent', 'title date location')
      .lean();

    return res.status(200).json(list);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list event preps' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const doc = await EventPrep.findOne({
      _id: id,
      createdBy: req.user._id,
    })
      .populate('linkedEvent', 'title date location category')
      .lean();

    if (!doc) {
      return res.status(404).json({ message: 'Event prep not found' });
    }

    return res.status(200).json(doc);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load event prep' });
  }
};

const removePrep = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const result = await EventPrep.deleteOne({
      _id: id,
      createdBy: req.user._id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Event prep not found' });
    }

    return res.status(200).json({ message: 'Deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete event prep' });
  }
};

module.exports = {
  chatPrep,
  savePrep,
  listMine,
  getById,
  removePrep,
};
