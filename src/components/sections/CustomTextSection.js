'use client';
import EditableText from '@/components/editables/EditableText';
import MotionDiv from '@/components/ui/MotionDiv';

export default function CustomTextSection({ section, index = 0 }) {
  // 1. Background Logic
  const rawColor = section.bgColor || '';
  const cleanColor = rawColor.trim();
  const isCustomColor = cleanColor.startsWith('#') || cleanColor.startsWith('var(');
  const bgStyle = isCustomColor ? { backgroundColor: cleanColor } : {};
  const bgClass = isCustomColor ? '' : 'bg-[var(--bg-primary)]';

  // 2. Alignment Logic (Separated for Text and the Anchor Line)
  let boxClasses = "max-w-4xl"; // Widened slightly for a better editorial reading measure
  let lineAlignment = "mr-auto"; // Default to left alignment for the line

  if (section.titleAlign === 'Center') {
    boxClasses += " mx-auto text-center";
    lineAlignment = "mx-auto";
  } else if (section.titleAlign === 'Right') {
    boxClasses += " ml-auto text-right";
    lineAlignment = "ml-auto";
  } else {
    boxClasses += " mr-auto text-left"; 
  }

  // Set a base delay so sections further down the page wait slightly longer
  const baseDelay = index * 0.1;

  // 3. Render
  return (
    <section style={bgStyle} className={`${bgClass} py-24 md:py-32`}>
      <div className="container mx-auto px-6 lg:px-20">
        <div className={boxClasses}>
          
          {/* Element 1: Title (Fades in first) */}
          <MotionDiv delay={baseDelay}>
            <EditableText 
              collection="sections" 
              docId={section.id} 
              fieldPath="title" 
              value={section.title} 
              tag="h2" 
              // Upgraded: Tighter tracking and slightly larger text for a premium header look
              className="text-4xl md:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]" 
            />
          </MotionDiv>

          {/* Element 2: Decorative Anchor Line (Expands second) */}
          <MotionDiv delay={baseDelay + 0.15}>
             <div className={`h-1.5 w-20 bg-[var(--accent)] rounded-full mt-6 mb-10 opacity-80 ${lineAlignment}`} />
          </MotionDiv>
          
          {/* Element 3: Markdown Content (Glides up third) */}
          <MotionDiv delay={baseDelay + 0.3}>
            <EditableText 
              collection="sections" 
              docId={section.id} 
              fieldPath="content" 
              value={section.content} 
              tag="div" 
              // Upgraded: Premium Prose. We format links, blockquotes, and bold text explicitly.
              className="
                prose prose-lg md:prose-xl dark:prose-invert max-w-none
                text-[var(--text-secondary)] leading-relaxed
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-[var(--text-primary)]
                prose-a:text-[var(--accent)] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline hover:prose-a:underline-offset-4
                prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)] prose-blockquote:bg-[var(--bg-secondary)]
                prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-[var(--text-primary)]
                prose-strong:text-[var(--text-primary)]
              " 
              markdown={true} 
            />
          </MotionDiv>

        </div>
      </div>
    </section>
  );
}