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
  const fullContext = (eventName + ' ' + (eventDetails || '')).toLowerCase();

  // Deterministic randomize based on context string length
  const hash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    return Math.abs(h);
  };
  const code = hash(fullContext);

  let requirements = [
    "- **Venue**: capacity, layout, accessibility, load-in windows",
    "- **Tech / AV**: mics, projectors, Wi‑Fi, backup recordings",
    "- **People**: core team, volunteers, MC, security if needed",
    "- **Budget**: venue, catering, swag, marketing, contingency (~10–15%)"
  ];

  let phases = [
    "| 8+ weeks | Theme, budget, venue shortlist, date hold |",
    "| 4–6 weeks | Speakers, sponsors, ticketing, comms plan |",
    "| 2 weeks | Runbook, rehearsal, volunteer briefing |",
    "| Week of | Final AV check, signage, emergency contacts |",
    "| Day-of | Registration flow, timing cues, incident response |",
    "| Post | Thank-you, survey, content recap |"
  ];

  let risks = [
    "- Low turnout → waitlist, partner cross-promo",
    "- AV failure → backup mics/slides offline",
    "- Overrun schedule → buffer slots, hard stops"
  ];

  if (fullContext.includes('hackathon') || fullContext.includes('tech') || fullContext.includes('coding')) {
    requirements = [
      "- **Venue**: Open hacking spaces, quiet zones, 24/7 access",
      "- **Tech / AV**: High-speed fiber internet, abundant power strips, enterprise Wi-Fi APs",
      "- **People**: Mentors, expert judges, technical support staff",
      "- **Budget**: Server costs, grand prizes, food and caffeine, swag"
    ];
    phases = [
      "| 10+ weeks | Define tech stack, secure API sponsors |",
      "| 4–6 weeks | Open registrations, announce judges |",
      "| 2 weeks | Finalize judging rubrics, test Wi-Fi |",
      "| Day-of (Morning) | Welcome, team formation, API demos |",
      "| Day-of (Night) | Midnight snack, 24/7 tech support |",
      "| Post | Winner announcements, code repository cleanup |"
    ];
    risks = [
      "- Wi-Fi outage → Dedicated backup line, strict bandwidth limits",
      "- API sponsor issues → Have backup cloud credits ready",
      "- Participant burnout → Mandatory rest zones, healthy food options"
    ];
  } else if (fullContext.includes('wedding') || fullContext.includes('party') || fullContext.includes('celebration')) {
    requirements = [
      "- **Venue**: Banquet hall, dance floor space, outdoor options",
      "- **Tech / AV**: DJ equipment, romantic lighting setup, photo booth",
      "- **People**: Event coordinator, catering staff, photographer/videographer",
      "- **Budget**: Food/drinks, decorations, attire, entertainment"
    ];
    phases = [
      "| 6+ months | Secure venue, book photographer and caterer |",
      "| 2–3 months | Send out invitations, finalize menu |",
      "| 1 month | Final fittings, seating chart drafting |",
      "| Week of | Final headcount to caterer, rehearsal dinner |",
      "| Day-of | Ceremony, cocktail hour, reception |",
      "| Post | Thank you notes, photo album selection |"
    ];
    risks = [
      "- Vendor no-show → Strict contracts, list of emergency backups",
      "- Bad weather → Indoor backup plan if outdoors",
      "- Dietary restrictions → Ensure caterer has extra inclusive meals"
    ];
  } else if (fullContext.includes('workshop') || fullContext.includes('training') || fullContext.includes('class')) {
    requirements = [
      "- **Venue**: Classroom-style seating, whiteboards",
      "- **Tech / AV**: Projector, lapel mic for instructor, participant laptops",
      "- **People**: Subject matter expert, teaching assistants",
      "- **Budget**: Printing materials, software licenses, lunch break"
    ];
    phases = [
      "| 4+ weeks | Curriculum design, instructor onboarding |",
      "| 2 weeks | Print workbooks, send pre-reading materials |",
      "| Week of | Software setup check, room arrangement |",
      "| Day-of | Morning instruction, afternoon hands-on, Q&A |",
      "| Post | Issue certificates, feedback survey |"
    ];
    risks = [
      "- Software issues → Provide cloud-based environments",
      "- Content too hard/easy → Modular curriculum to adjust on the fly",
      "- Laptops die → Assure power sockets at every desk"
    ];
  } else {
    // Inject dynamic generic elements to vary the blueprint based on the event context
    const extraReqs = [
      "- **Logistics**: Transportation arrangements, parking validation",
      "- **Compliance**: Required city permits and liability insurance"
    ];
    const extraRisks = [
      "- Keynote cancellation → Prepare a pre-recorded backup or panel discussion",
      "- Unexpected attendance spike → Have scalable digital resources and extra seating"
    ];
    if (code % 2 === 0) requirements.push(extraReqs[0]);
    else requirements.push(extraReqs[1]);
    
    if (code % 3 === 0) risks.push(extraRisks[0]);
    else risks.push(extraRisks[1]);
  }

  return `## Executive summary
This prep pack outlines how to plan and execute **${eventName}**. Use it as a working blueprint; adjust dates and numbers to your context.

## Goals & success metrics
- Deliver a smooth attendee experience from registration to follow-up
- Hit target attendance and engagement
- Stay within budget and timeline

## Requirements
${requirements.join('\n')}

## Blueprint / run-of-show
| Phase | Focus |
|-------|--------|
${phases.join('\n')}

## Stakeholders & roles
- **Owner**: single DRI for decisions
- **Ops**: venue, vendors, day-of logistics
- **Comms**: social, email, partners

## Risks & mitigations
${risks.join('\n')}

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

*Demo mode (API Key not configured): The above blueprint was generated dynamically based on your keywords. Add \`OPENAI_API_KEY\` to backend \`.env\` for full AI-generated blueprints.*`;
}

function buildDemoReply(eventName, eventDetails, messages) {
  if (messages && messages.length > 0) {
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const lowerMsg = lastUserMessage.toLowerCase();
    
    const fallbacks = [
      "Here's a suggestion based on your query: Ensure you document this in your runbook and assign a clear owner so nothing falls through the cracks.",
      "That's a great point. I recommend setting up a quick sync with your core team to align on this specific detail.",
      "Make sure you factor this into your day-of timeline. Adding a small buffer around this activity usually helps prevent delays.",
      "You might want to review your venue contract or local guidelines to ensure there are no restrictions regarding this.",
      "Consider polling your attendees or sending a pre-event survey to gather more specific data on this.",
      "This is a common challenge! A good best practice is to have a dedicated volunteer or staff member oversee this specific aspect.",
      "I’d suggest allocating a small portion of your contingency budget to cover this just in case.",
      "It never hurts to have a backup plan for this. Think about what a 'Plan B' would look like if things go wrong on the day.",
      "Great idea. I would highly recommend standardizing this into a checklist so that any staff member can easily execute it.",
      "If you're unsure, consulting a professional vendor or someone who has run a similar event could provide the exact blueprint you need here."
    ];

    const hash = (str) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
      return Math.abs(h);
    };

    let recommendation = fallbacks[hash(lowerMsg) % fallbacks.length];
    
    if (lowerMsg.includes("budget") || lowerMsg.includes("cost") || lowerMsg.includes("money") || lowerMsg.includes("price") || lowerMsg.includes("expensive")) {
      recommendation = "For budget concerns, I recommend adding a 15% contingency buffer. You can often save costs by securing early-bird vendor rates or looking for local community sponsors.";
    } else if (lowerMsg.includes("speaker") || lowerMsg.includes("guest") || lowerMsg.includes("invite") || lowerMsg.includes("panel")) {
      recommendation = "When dealing with speakers or special guests, setup a pre-event technical check. Provide them with a brief outlining the audience demographics and speaking topics early on.";
    } else if (lowerMsg.includes("sponsor") || lowerMsg.includes("partner") || lowerMsg.includes("brand")) {
      recommendation = "To attract sponsors, create a tiered sponsorship package (e.g., Gold, Silver, Bronze). Highlight the expected attendee demographics and brand exposure they will get.";
    } else if (lowerMsg.includes("schedule") || lowerMsg.includes("time") || lowerMsg.includes("late") || lowerMsg.includes("duration")) {
      recommendation = "When making a schedule, always leave 10-15 minute buffer times between sessions. Events rarely run perfectly on time, and buffers prevent cascading delays.";
    } else if (lowerMsg.includes("food") || lowerMsg.includes("catering") || lowerMsg.includes("drink") || lowerMsg.includes("eat") || lowerMsg.includes("meal")) {
      recommendation = "For catering, aim to collect dietary restrictions during registration. Usually, planning 20% vegetarian/vegan options covers most bases if you don't have exact numbers.";
    } else if (lowerMsg.includes("promote") || lowerMsg.includes("marketing") || lowerMsg.includes("ads") || lowerMsg.includes("social")) {
      recommendation = "Leverage your community! Offer referral discounts or encourage attendees to share on social media. Early bird pricing is also highly effective at driving early registrations.";
    } else if (lowerMsg.includes("venue") || lowerMsg.includes("location") || lowerMsg.includes("space")) {
      recommendation = "When dealing with venues, immediately confirm their load-in times, Wi-Fi bandwidth limits, and whether they require exclusive use of their in-house catering or AV teams.";
    } else if (lowerMsg.includes("volunteer") || lowerMsg.includes("staff") || lowerMsg.includes("help") || lowerMsg.includes("team")) {
      recommendation = "Volunteers are crucial. Create a dedicated 'Volunteer Briefing' document outlining where to check-in, what to wear, their specific duties, and emergency contacts.";
    } else if (lowerMsg.includes("security") || lowerMsg.includes("safe") || lowerMsg.includes("permit") || lowerMsg.includes("legal")) {
      recommendation = "Safety first! Check with your local precinct if you need event permits. Ensure you identify all emergency exits and share an evacuation plan with your core team.";
    } else if (lowerMsg.includes("music") || lowerMsg.includes("dj") || lowerMsg.includes("sound") || lowerMsg.includes("av") || lowerMsg.includes("tech")) {
      recommendation = "For AV and technical setups, demand a full run-through 2 hours before doors open. Always bring backup adapters, HDMI cables, and an offline copy of your playlists/presentations.";
    }

    return `**Assistant Recommendation:**\n\n${recommendation}\n\n*(Note: This is a dynamically generated response in demo mode. For true AI reasoning, add your \`OPENAI_API_KEY\` to the \`.env\` file.)*`;
  }
  
  return buildDemoBlueprint(eventName, eventDetails);
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
    if (req.user.role !== 'core') {
      return res.status(403).json({ message: 'Only Core team members are permitted to generate blueprints' });
    }
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
      reply = buildDemoReply(name, details, messages);
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
    if (req.user.role !== 'core') {
      return res.status(403).json({ message: 'Only Core team members are permitted to save blueprints' });
    }
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
    if (req.user.role === 'participant') {
      return res.status(403).json({ message: 'Access denied: Participants cannot view event preps' });
    }
    // Allow core and volunteers to see all saved preps in the shared library
    const filter = {};
    const list = await EventPrep.find(filter)
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
