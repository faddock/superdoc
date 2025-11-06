import { EditorWithChat } from 'components/EditorWithChat';

/**
 * PageOne - Demo page for Superdoc editor with AI chat
 */
const PageOne = () => {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Editor with Chat - Takes remaining space */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <EditorWithChat initialContent="asdf" documentId="demo-doc" />
      </div>
    </div>
  );
};

export default PageOne;
