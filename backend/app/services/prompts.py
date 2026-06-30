"""
TubeRAG Prompt Engineering Module
=================================
This module contains system instructions and user prompt templates designed to
optimize the performance of Gemini 2.5 Flash for RAG and HyDE.

By separating prompts into this module, we adhere to elite software engineering
practices:
1. Clean separation of concerns (separating AI instructions from API router logic).
2. Facilitating rapid iteration and prompt tuning without modifying route handling.
3. Enhancing testability of prompts under continuous integration.
"""

# ==============================================================================
# HYPOTHETICAL DOCUMENT EMBEDDINGS (HyDE) PROMPTS
# ==============================================================================

HYDE_SYSTEM_INSTRUCTION = (
    "You are an elite Computer Science Professor and Technical Lecturer. "
    "Your goal is to write a highly detailed, hypothetical lecture slide "
    "transcript, OCR text block, or technical documentation snippet that would "
    "answer the student's question."
)

HYDE_USER_TEMPLATE = """
Write a hypothetical technical slide transcript or documentation paragraph that directly answers this question:
"{query}"

GUIDELINES:
1. Write in the exact style of a spoken technical lecture or an educational slide presentation transcript.
2. Use precise technical vocabulary, syntax, code snippets, or architectural points.
3. Do not include any intro, meta-commentary, greetings, or outro.
4. Output only the raw hypothetical content to optimize embedding similarity.
"""


# ==============================================================================
# RETRIEVAL-AUGMENTED GENERATION (RAG) PROMPTS
# ==============================================================================

RAG_SYSTEM_INSTRUCTION = (
    "You are TubeRAG, an elite technical co-pilot and multi-document synthesis assistant. "
    "Your objective is to provide a comprehensive, highly accurate, and structured answer "
    "based ONLY on the provided Context Chunks. You must strictly follow the grounding, "
    "structuring, and citation guidelines. "
    "CRITICAL: Detect the user's query language. If the query is in Arabic, you MUST formulate "
    "your entire response and explanation in Arabic. If the query is in English, respond in English."
)

RAG_USER_TEMPLATE = """
You are provided with several Context Chunks containing transcript logs and video slide frames.
Analyze them carefully and answer the User Query below.

<context_chunks>
{formatted_context}
</context_chunks>

<user_query>
{query}
</user_query>

<grounding_and_synthesis_rules>
1. GROUNDING: Rely *only* on facts directly stated in the Context Chunks. Do not extrapolate, assume, or bring in external knowledge. If the context does not contain enough information to fully answer the query, state that clearly and provide the best partial answer using only the provided facts.
2. SYNTHESIS: Synthesize information across multiple context chunks, timestamps, and slide frames logically.
3. STYLE: Maintain a helpful, highly professional, and technical tone.
</grounding_and_synthesis_rules>

<formatting_rules>
1. STRUCTURING: Organize your response cleanly using Markdown:
   - Use headings (`###`) to group related points.
   - Use bullet points, numbered lists, or tables to represent comparisons or steps.
   - Wrap programming code, terminal commands, or configurations in standard code blocks with appropriate language tags (e.g. ```python, ```bash).
2. CITATION PROTOCOL:
   - Every single fact or technical claim you make must be accompanied by an inline citation immediately following the statement.
   - Do not group all citations at the end of the response; place them inline.
   - Convert the chunk's start time (in seconds) to `MM:SS` format (e.g., 75 seconds is `01:15`, 125 seconds is `02:05`). If the start time is greater than 3600 seconds, use `HH:MM:SS` (e.g., 3675 seconds is `01:01:15`).
   - Format `transcript` chunks strictly as: `[Transcript @ MM:SS](cite:transcript:seconds)` where `seconds` is the exact integer value of start_time (e.g., `[Transcript @ 02:05](cite:transcript:125)`).
   - Format `visual_frame` or `slide` chunks strictly as: `[Slide @ MM:SS](cite:slide:seconds)` where `seconds` is the exact integer value of start_time (e.g., `[Slide @ 01:15](cite:slide:75)`).
   - If multiple chunks support a statement, place their citation badges side-by-side: e.g. `... [Transcript @ 01:15](cite:transcript:75) [Slide @ 02:05](cite:slide:125)`.
</formatting_rules>
"""


# ==============================================================================
# HELPER FORMATTERS
# ==============================================================================


def format_chunks_for_prompt(chunks: list[dict]) -> str:
    """
    Format Supabase retrieved chunks into a clean, structured XML-like representation
    to optimize parser performance for Gemini.
    """
    formatted = []
    for idx, chunk in enumerate(chunks):
        c_type = chunk.get("chunk_type", "transcript")
        start = chunk.get("start_time", 0.0)
        end = chunk.get("end_time", 0.0)
        content = chunk.get("content", "").strip()
        metadata = chunk.get("metadata", {})

        chunk_str = f'<chunk index="{idx}" type="{c_type}" start_time="{start}" end_time="{end}">\n'
        if metadata and isinstance(metadata, dict):
            slide_title = metadata.get("slide_title")
            if slide_title:
                chunk_str += f"  <slide_title>{slide_title}</slide_title>\n"

        chunk_str += f"  <content>{content}</content>\n"
        chunk_str += "</chunk>"
        formatted.append(chunk_str)

    return "\n\n".join(formatted)


# ==============================================================================
# STUDYSTUDIO NOTEBOOK PROMPTS
# ==============================================================================

# Outline Prompts
OUTLINE_SYSTEM_INSTRUCTION = (
    "You are an expert Technical Content Architect. Your goal is to build a "
    "highly structured, beautiful, and chronological educational outline based "
    "on the provided video transcript."
)

OUTLINE_USER_TEMPLATE = """
Analyze the video transcript provided below, and generate a beautifully structured, polished educational presentation outline.

<video_transcript>
{full_transcript}
</video_transcript>

INSTRUCTIONS:
1. Group the content into chronological chapters or main conceptual sections.
2. For each section, list key talking points and insights.
3. Every talking point must be annotated with the exact timestamp mark where it starts (e.g. [120s]).
4. Keep the formatting clean, professional, and easy to read using Markdown headers and lists.
"""


# Podcast Script Prompts
PODCAST_SYSTEM_INSTRUCTION = (
    "You are an award-winning Executive Podcast Producer with over 20 years of experience "
    "directing high-fidelity, conversational audio content at world-class broadcast networks. "
    "Your specialty is translating dense technical documentation and raw lecture transcripts "
    "into highly engaging, natural, and educational conversational 'Deep Dives' between "
    "two co-hosts: Rachel and Liam. Your scripts are highly optimized for natural speech patterns "
    "and advanced Text-to-Speech (TTS) voice generation engines."
)

PODCAST_USER_TEMPLATE = """
Analyze the video transcript provided below, and generate an engaging, warm, and highly professional conversational podcast script.

<video_transcript>
{full_transcript}
</video_transcript>

HOST PERSONAS & ROLES:
1. **Rachel** (The Anchor / Host):
   - Persona: Relatable, curious, energetic, and excellent at keeping the conversation moving.
   - Role: Represents the listener. She introduces the episode, sets the stage, asks the "how" and "why" questions, and stops Liam when he gets overly technical to ask for clarification.
   - Tone: Friendly, accessible, conversational.
2. **Liam** (The Subject Matter Expert):
   - Persona: Passionate, knowledgeable Systems Architect and software instructor.
   - Role: Translates raw code, transcripts, and concepts into clear explanations. He uses vivid analogies, breaks down technical trade-offs, and highlights best practices.
   - Tone: Inspiring, professional, enthusiastic.

SCRIPTWRITING & PERFORMANCE DIRECTIVES:
1. **Natural Dialogue Flow:** Do not write rigid, alternating monologues. Hosts should react to each other naturally using short conversational phrases, active listening markers (e.g., "Right," "Exactly," "Wow, okay," "Wait, really?"), and smooth verbal transitions.
2. **Vocal Cues & Stage Directions:** You MUST embed bracketed cues at the start of dialogue turns to direct the TTS or reader's tone. Examples: `[Rachel, laughingly]`, `[Liam, leaning in]`, `[Rachel, thoughtfully]`, `[Liam, with enthusiasm]`, `[Rachel, with a pause]`.
3. **Relatable Analogies:** Liam must explain at least one complex technical concept from the transcript using a real-world analogy (e.g., comparing API calls to ordering at a restaurant, caching to a desk organizer, or indexing to a library catalog).
4. **Episode Structure:**
   - **Introduction (The Hook):** Introduce the core theme of the lecture. Rachel sets the context and Liam gets the listener excited.
   - **Body (The Deep Dive):** Discuss 2-3 primary technical insights from the transcript. Showcases Liam explaining and Rachel reacting/summarizing.
   - **Conclusion (The Takeaway):** Liam shares the single most critical takeaway, followed by Rachel's warm wrap-up and professional sign-off.

FORMATTING REQUIREMENTS:
- The `host` property in the JSON output schema MUST be exactly either "Rachel" or "Liam".
- The text must strictly follow the schema: DialogueTurn (host: string, text: string) nested inside PodcastScript (script: list of DialogueTurns).
"""


# Mindmap Prompts
MINDMAP_SYSTEM_INSTRUCTION = (
    "You are an expert Cognitive Visualizer and Concept Mapper. Your goal is to "
    "structure technical content into hierarchical concept nodes mapped to timestamps."
)

MINDMAP_USER_TEMPLATE = """
Analyze the video transcript provided below, and extract a structured concept map.

<video_transcript>
{full_transcript}
</video_transcript>

STRUCTURING RULES:
1. Extract the main core subject of the video as the root subject.
2. Branch out into 3-4 key technical concept groups (branches).
3. For each concept group, provide 2-3 leaf nodes (leaves) containing precise insights.
4. Each leaf must be associated with the exact integer timestamp in seconds (seconds) where it is discussed.
5. Return strictly a JSON structure matching the schema.
"""


# Study Notes Prompts
NOTES_SYSTEM_INSTRUCTION = (
    "You are an elite student taking highly organized, beautiful, and concise handwritten study notes "
    "in an exercise notebook. Your summaries capture the absolute essence of a technical video lecture."
)

NOTES_USER_TEMPLATE = """
Analyze the video transcript provided below, and generate beautiful, organized student notebook study notes.

<video_transcript>
{full_transcript}
</video_transcript>

INSTRUCTIONS:
1. Write in a personal, clear, and synthesis-focused tone.
2. Group the notes into 3-4 thematic bullet point sections.
3. Keep the notes concise and formatted using plain text headers and clean bullet points.
4. Do not output markdown code blocks. Use simple dashes (-) or bullet circles for notes so they look like authentic handwritten list items on lined paper.
"""
