#!/usr/bin/env python3
"""
Phasor Release Editor
A GUI Release Editor
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog, scrolledtext
import json
import os
from typing import Dict, Any, Optional


class ReleaseEditor:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Phasor Release Editor")
        self.root.geometry("1000x700")
        
        self.index_data: Dict[str, Any] = {}
        self.meta_data: Dict[str, Any] = {}
        self.current_version: Optional[str] = None
        self.index_file_path = ""
        self.meta_file_path = ""
        
        self.setup_ui()
        
    def setup_ui(self):
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="Load index.json", command=self.load_index)
        file_menu.add_command(label="Load meta.json", command=self.load_meta)
        file_menu.add_separator()
        file_menu.add_command(label="Save index.json", command=self.save_index)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.root.quit)
        
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(1, weight=1)
        
        list_frame = ttk.LabelFrame(main_frame, text="Versions", padding="5")
        list_frame.grid(row=0, column=0, rowspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 5))
        
        list_scroll = ttk.Scrollbar(list_frame)
        list_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.version_listbox = tk.Listbox(list_frame, yscrollcommand=list_scroll.set, width=20)
        self.version_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        list_scroll.config(command=self.version_listbox.yview)
        
        self.version_listbox.bind('<<ListboxSelect>>', self.on_version_select)
        
        btn_frame = ttk.Frame(list_frame)
        btn_frame.pack(fill=tk.X, pady=(5, 0))
        
        ttk.Button(btn_frame, text="New Version", command=self.new_version).pack(fill=tk.X, pady=2)
        ttk.Button(btn_frame, text="Delete Version", command=self.delete_version).pack(fill=tk.X, pady=2)
        
        editor_frame = ttk.LabelFrame(main_frame, text="Release Details", padding="5")
        editor_frame.grid(row=0, column=1, sticky=(tk.W, tk.E, tk.N, tk.S))
        editor_frame.columnconfigure(1, weight=1)
        
        row = 0
        ttk.Label(editor_frame, text="Version:").grid(row=row, column=0, sticky=tk.W, pady=2)
        self.version_var = tk.StringVar()
        ttk.Entry(editor_frame, textvariable=self.version_var, state='readonly').grid(row=row, column=1, sticky=(tk.W, tk.E), pady=2, padx=(5, 0))
        
        row += 1
        ttk.Label(editor_frame, text="Title:").grid(row=row, column=0, sticky=tk.W, pady=2)
        self.title_var = tk.StringVar()
        ttk.Entry(editor_frame, textvariable=self.title_var).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=2, padx=(5, 0))
        
        row += 1
        ttk.Label(editor_frame, text="Commit:").grid(row=row, column=0, sticky=tk.W, pady=2)
        self.commit_var = tk.StringVar()
        ttk.Entry(editor_frame, textvariable=self.commit_var).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=2, padx=(5, 0))
        
        row += 1
        ttk.Label(editor_frame, text="Type:").grid(row=row, column=0, sticky=tk.W, pady=2)
        self.type_var = tk.StringVar()
        type_combo = ttk.Combobox(editor_frame, textvariable=self.type_var, values=["stable", "beta", "alpha", "rc"])
        type_combo.grid(row=row, column=1, sticky=(tk.W, tk.E), pady=2, padx=(5, 0))
        
        row += 1
        ttk.Label(editor_frame, text="GitHub Release:").grid(row=row, column=0, sticky=tk.W, pady=2)
        self.gh_release_var = tk.StringVar()
        ttk.Entry(editor_frame, textvariable=self.gh_release_var).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=2, padx=(5, 0))
        
        row += 1
        ttk.Label(editor_frame, text="GitHub Changes:").grid(row=row, column=0, sticky=tk.W, pady=2)
        self.gh_changes_var = tk.StringVar()
        ttk.Entry(editor_frame, textvariable=self.gh_changes_var).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=2, padx=(5, 0))
        
        row += 1
        ttk.Label(editor_frame, text="VSCode Release:").grid(row=row, column=0, sticky=tk.W, pady=2)
        self.vscode_release_var = tk.StringVar()
        ttk.Entry(editor_frame, textvariable=self.vscode_release_var).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=2, padx=(5, 0))
        
        row += 1
        ttk.Label(editor_frame, text="VS Release:").grid(row=row, column=0, sticky=tk.W, pady=2)
        self.vs_release_var = tk.StringVar()
        ttk.Entry(editor_frame, textvariable=self.vs_release_var).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=2, padx=(5, 0))
        
        row += 1
        ttk.Label(editor_frame, text="Source (.tar.gz):").grid(row=row, column=0, sticky=tk.W, pady=2)
        self.src_var = tk.StringVar()
        ttk.Entry(editor_frame, textvariable=self.src_var).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=2, padx=(5, 0))
        
        row += 1
        ttk.Label(editor_frame, text="Source (.zip):").grid(row=row, column=0, sticky=tk.W, pady=2)
        self.zip_var = tk.StringVar()
        ttk.Entry(editor_frame, textvariable=self.zip_var).grid(row=row, column=1, sticky=(tk.W, tk.E), pady=2, padx=(5, 0))
        
        details_frame = ttk.Frame(main_frame)
        details_frame.grid(row=1, column=1, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(5, 0))
        details_frame.columnconfigure(0, weight=1)
        details_frame.columnconfigure(1, weight=1)
        details_frame.rowconfigure(0, weight=1)
        
        features_frame = ttk.LabelFrame(details_frame, text="Features", padding="5")
        features_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 2))
        features_frame.columnconfigure(0, weight=1)
        features_frame.rowconfigure(0, weight=1)
        
        self.features_text = scrolledtext.ScrolledText(features_frame, height=10, wrap=tk.WORD)
        self.features_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        ttk.Label(features_frame, text="(One feature per line)", font=('', 8, 'italic')).grid(row=1, column=0, sticky=tk.W, pady=(2, 0))
        
        files_frame = ttk.LabelFrame(details_frame, text="Files", padding="5")
        files_frame.grid(row=0, column=1, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(2, 0))
        files_frame.columnconfigure(0, weight=1)
        files_frame.rowconfigure(0, weight=1)
        
        files_tree_frame = ttk.Frame(files_frame)
        files_tree_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        files_tree_frame.columnconfigure(0, weight=1)
        files_tree_frame.rowconfigure(0, weight=1)
        
        files_scroll = ttk.Scrollbar(files_tree_frame)
        files_scroll.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.files_tree = ttk.Treeview(files_tree_frame, columns=('URL', 'Hash'), 
                                       yscrollcommand=files_scroll.set, height=8)
        self.files_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        files_scroll.config(command=self.files_tree.yview)
        
        self.files_tree.heading('#0', text='Key')
        self.files_tree.heading('URL', text='URL')
        self.files_tree.heading('Hash', text='SHA256')
        self.files_tree.column('#0', width=100)
        self.files_tree.column('URL', width=200)
        self.files_tree.column('Hash', width=150)
        
        files_btn_frame = ttk.Frame(files_frame)
        files_btn_frame.grid(row=1, column=0, sticky=(tk.W, tk.E), pady=(5, 0))
        
        ttk.Button(files_btn_frame, text="Add File", command=self.add_file).pack(side=tk.LEFT, padx=2)
        ttk.Button(files_btn_frame, text="Edit File", command=self.edit_file).pack(side=tk.LEFT, padx=2)
        ttk.Button(files_btn_frame, text="Delete File", command=self.delete_file).pack(side=tk.LEFT, padx=2)
        
        save_frame = ttk.Frame(main_frame)
        save_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(10, 0))
        
        ttk.Button(save_frame, text="Save Changes", command=self.save_changes, 
                  style='Accent.TButton').pack(side=tk.RIGHT)
        
        self.status_var = tk.StringVar(value="Ready")
        ttk.Label(save_frame, textvariable=self.status_var, relief=tk.SUNKEN).pack(side=tk.LEFT, fill=tk.X, expand=True)
        
    def load_index(self):
        filename = filedialog.askopenfilename(
            title="Select index.json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        if filename:
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    self.index_data = json.load(f)
                self.index_file_path = filename
                self.populate_version_list()
                self.status_var.set(f"Loaded: {os.path.basename(filename)}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load index.json:\n{str(e)}")
    
    def load_meta(self):
        filename = filedialog.askopenfilename(
            title="Select meta.json",
            filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
        )
        if filename:
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    self.meta_data = json.load(f)
                self.meta_file_path = filename
                self.status_var.set(f"Loaded meta: {os.path.basename(filename)}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to load meta.json:\n{str(e)}")
    
    def save_index(self):
        if not self.index_file_path:
            filename = filedialog.asksaveasfilename(
                title="Save index.json",
                defaultextension=".json",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
            )
            if not filename:
                return
            self.index_file_path = filename
        
        try:
            with open(self.index_file_path, 'w', encoding='utf-8') as f:
                json.dump(self.index_data, f, indent=4, ensure_ascii=False)
            self.status_var.set(f"Saved: {os.path.basename(self.index_file_path)}")
            messagebox.showinfo("Success", "index.json saved successfully!")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save index.json:\n{str(e)}")
    
    def populate_version_list(self):
        self.version_listbox.delete(0, tk.END)
        versions = sorted(self.index_data.keys(), 
                         key=lambda v: [int(x) if x.isdigit() else x for x in v.split('.')],
                         reverse=True)
        for version in versions:
            self.version_listbox.insert(tk.END, version)
    
    def on_version_select(self, event):
        selection = self.version_listbox.curselection()
        if not selection:
            return
        
        version = self.version_listbox.get(selection[0])
        self.current_version = version
        self.load_version_data(version)
    
    def load_version_data(self, version: str):
        data = self.index_data.get(version, {})
        
        self.version_var.set(version)
        self.title_var.set(data.get('title', ''))
        self.commit_var.set(data.get('commit', ''))
        self.type_var.set(data.get('type', ''))
        self.gh_release_var.set(data.get('gh_release', ''))
        self.gh_changes_var.set(data.get('gh_changes', ''))
        self.vscode_release_var.set(data.get('vscode_release', ''))
        self.vs_release_var.set(data.get('vs_release', ''))
        self.src_var.set(data.get('src', ''))
        self.zip_var.set(data.get('zip', ''))
        
        self.features_text.delete('1.0', tk.END)
        features = data.get('features', [])
        self.features_text.insert('1.0', '\n'.join(features))
        
        self.files_tree.delete(*self.files_tree.get_children())
        files = data.get('files', {})
        for key, file_data in files.items():
            url = file_data.get('url', '')
            hash_val = file_data.get('hash', '')
            self.files_tree.insert('', tk.END, text=key, values=(url, hash_val))
    
    def save_changes(self):
        if not self.current_version:
            messagebox.showwarning("Warning", "No version selected")
            return
        
        data = {
            'title': self.title_var.get(),
            'commit': self.commit_var.get(),
            'type': self.type_var.get(),
            'gh_release': self.gh_release_var.get(),
            'gh_changes': self.gh_changes_var.get(),
        }
        
        if self.vscode_release_var.get():
            data['vscode_release'] = self.vscode_release_var.get()
        
        if self.vs_release_var.get():
            data['vs_release'] = self.vs_release_var.get()
        
        features_text = self.features_text.get('1.0', tk.END).strip()
        data['features'] = [f.strip() for f in features_text.split('\n') if f.strip()]
        
        files = {}
        for item in self.files_tree.get_children():
            key = self.files_tree.item(item, 'text')
            values = self.files_tree.item(item, 'values')
            files[key] = {
                'url': values[0],
                'hash': values[1]
            }
        data['files'] = files
        
        if self.src_var.get():
            data['src'] = self.src_var.get()
        
        if self.zip_var.get():
            data['zip'] = self.zip_var.get()
        
        self.index_data[self.current_version] = data
        self.status_var.set(f"Changes saved to {self.current_version}")
        messagebox.showinfo("Success", f"Changes to {self.current_version} saved in memory.\nUse File > Save to write to disk.")
    
    def new_version(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("New Version")
        dialog.geometry("300x100")
        dialog.transient(self.root)
        dialog.grab_set()
        
        ttk.Label(dialog, text="Version Number:").pack(pady=(10, 5))
        version_entry = ttk.Entry(dialog, width=30)
        version_entry.pack(pady=5)
        version_entry.focus()
        
        def create():
            version = version_entry.get().strip()
            if not version:
                messagebox.showwarning("Warning", "Version number cannot be empty")
                return
            
            if version in self.index_data:
                messagebox.showwarning("Warning", f"Version {version} already exists")
                return
            
            # Create new version with template
            self.index_data[version] = {
                'title': version,
                'commit': '',
                'type': 'beta',
                'gh_release': '',
                'gh_changes': '',
                'features': [],
                'files': {}
            }
            
            self.populate_version_list()
            # Select the new version
            versions = list(self.version_listbox.get(0, tk.END))
            if version in versions:
                self.version_listbox.selection_clear(0, tk.END)
                self.version_listbox.selection_set(versions.index(version))
                self.version_listbox.event_generate('<<ListboxSelect>>')
            
            dialog.destroy()
        
        ttk.Button(dialog, text="Create", command=create).pack(pady=5)
    
    def delete_version(self):
        selection = self.version_listbox.curselection()
        if not selection:
            messagebox.showwarning("Warning", "No version selected")
            return
        
        version = self.version_listbox.get(selection[0])
        
        if messagebox.askyesno("Confirm Delete", 
                              f"Are you sure you want to delete version {version}?"):
            del self.index_data[version]
            self.populate_version_list()
            self.current_version = None
            self.clear_fields()
            self.status_var.set(f"Deleted version {version}")
    
    def clear_fields(self):
        self.version_var.set('')
        self.title_var.set('')
        self.commit_var.set('')
        self.type_var.set('')
        self.gh_release_var.set('')
        self.gh_changes_var.set('')
        self.vscode_release_var.set('')
        self.vs_release_var.set('')
        self.src_var.set('')
        self.zip_var.set('')
        self.features_text.delete('1.0', tk.END)
        self.files_tree.delete(*self.files_tree.get_children())
    
    def add_file(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("Add File")
        dialog.geometry("500x200")
        dialog.transient(self.root)
        dialog.grab_set()
        
        ttk.Label(dialog, text="Key:").grid(row=0, column=0, sticky=tk.W, padx=10, pady=5)
        key_var = tk.StringVar()
        key_combo = ttk.Combobox(dialog, textvariable=key_var, width=40)
        key_combo['values'] = list(self.meta_data.keys()) if self.meta_data else []
        key_combo.grid(row=0, column=1, padx=10, pady=5)
        
        ttk.Label(dialog, text="URL:").grid(row=1, column=0, sticky=tk.W, padx=10, pady=5)
        url_var = tk.StringVar()
        ttk.Entry(dialog, textvariable=url_var, width=40).grid(row=1, column=1, padx=10, pady=5)
        
        ttk.Label(dialog, text="SHA256 Hash:").grid(row=2, column=0, sticky=tk.W, padx=10, pady=5)
        hash_var = tk.StringVar()
        ttk.Entry(dialog, textvariable=hash_var, width=40).grid(row=2, column=1, padx=10, pady=5)
        
        def add():
            key = key_var.get().strip()
            url = url_var.get().strip()
            hash_val = hash_var.get().strip()
            
            if not key:
                messagebox.showwarning("Warning", "Key cannot be empty")
                return
            
            self.files_tree.insert('', tk.END, text=key, values=(url, hash_val))
            dialog.destroy()
        
        ttk.Button(dialog, text="Add", command=add).grid(row=3, column=1, pady=10, sticky=tk.E)
    
    def edit_file(self):
        selection = self.files_tree.selection()
        if not selection:
            messagebox.showwarning("Warning", "No file selected")
            return
        
        item = selection[0]
        key = self.files_tree.item(item, 'text')
        values = self.files_tree.item(item, 'values')
        
        dialog = tk.Toplevel(self.root)
        dialog.title("Edit File")
        dialog.geometry("500x200")
        dialog.transient(self.root)
        dialog.grab_set()
        
        ttk.Label(dialog, text="Key:").grid(row=0, column=0, sticky=tk.W, padx=10, pady=5)
        key_var = tk.StringVar(value=key)
        ttk.Entry(dialog, textvariable=key_var, width=40, state='readonly').grid(row=0, column=1, padx=10, pady=5)
        
        ttk.Label(dialog, text="URL:").grid(row=1, column=0, sticky=tk.W, padx=10, pady=5)
        url_var = tk.StringVar(value=values[0])
        ttk.Entry(dialog, textvariable=url_var, width=40).grid(row=1, column=1, padx=10, pady=5)
        
        ttk.Label(dialog, text="SHA256 Hash:").grid(row=2, column=0, sticky=tk.W, padx=10, pady=5)
        hash_var = tk.StringVar(value=values[1])
        ttk.Entry(dialog, textvariable=hash_var, width=40).grid(row=2, column=1, padx=10, pady=5)
        
        def save():
            url = url_var.get().strip()
            hash_val = hash_var.get().strip()
            self.files_tree.item(item, values=(url, hash_val))
            dialog.destroy()
        
        ttk.Button(dialog, text="Save", command=save).grid(row=3, column=1, pady=10, sticky=tk.E)
    
    def delete_file(self):
        selection = self.files_tree.selection()
        if not selection:
            messagebox.showwarning("Warning", "No file selected")
            return
        
        if messagebox.askyesno("Confirm Delete", "Delete selected file?"):
            self.files_tree.delete(selection[0])


def main():
    root = tk.Tk()
    app = ReleaseEditor(root)
    root.mainloop()


if __name__ == "__main__":
    main()