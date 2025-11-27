import React, { useState } from 'react';
import { FolderTreeItem } from '../api/folder';
import { ChevronRight, ChevronDown, Folder as FolderIcon, Plus } from 'lucide-react';

interface FolderTreeProps {
  folders: FolderTreeItem[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  onAddFolder: (parentId: string | null) => void;
}

const FolderItem: React.FC<{
  folder: FolderTreeItem;
  selectedFolderId: string | null;
  onSelectFolder: (id: string) => void;
  onAddFolder: (parentId: string | null) => void;
  depth: number;
}> = ({ folder, selectedFolderId, onSelectFolder, onAddFolder, depth }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = folder.id === selectedFolderId;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 ${
          isSelected ? 'bg-blue-50 text-blue-600' : ''
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelectFolder(folder.id)}
      >
        <div onClick={handleToggle} className="mr-1 text-gray-500">
          {folder.children && folder.children.length > 0 ? (
            isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <div className="w-4" />
          )}
        </div>
        <FolderIcon size={16} className="mr-2 text-yellow-500" />
        <span className="text-sm flex-1 truncate">{folder.name}</span>
        <button
          className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onAddFolder(folder.id);
          }}
        >
          <Plus size={14} />
        </button>
      </div>
      
      {isOpen && folder.children && (
        <div>
          {folder.children.map((child) => (
            <FolderItem
              key={child.id}
              folder={child}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onAddFolder={onAddFolder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onAddFolder,
}) => {
  return (
    <div className="w-64 border-r h-full bg-gray-50 overflow-y-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-bold text-gray-700">탐색기</h2>
        <button
          onClick={() => onAddFolder(null)}
          className="p-1 hover:bg-gray-200 rounded text-gray-600"
          title="루트 폴더 추가"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="py-2">
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            onAddFolder={onAddFolder}
            depth={1}
          />
        ))}
      </div>
    </div>
  );
};

