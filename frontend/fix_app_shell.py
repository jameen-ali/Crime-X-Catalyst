import re

file_path = r'e:\Crime X\frontend\src\layouts\AppShell.tsx'

# Read file with errors='replace' to avoid crash
with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Let's find the Profile block. It starts with {/* Profile */}
# and goes up to the AnimatePresence /div block for Profile
profile_pattern = re.compile(
    r'\{\/\* Profile \*\/.*?AnimatePresence>.*?<\/div>', 
    re.DOTALL
)

replacement = """{/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Profile menu"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-white">{user?.name}</div>
                  <div className="text-[10px] text-gray-400">{user?.rank}</div>
                </div>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 w-56 bg-[#111827] border border-[#1F2D40] rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[#1F2D40]">
                      <div className="text-sm font-semibold text-white">{user?.name}</div>
                      <div className="text-xs text-gray-400">{user?.email}</div>
                      <div className="text-[10px] text-blue-400 mt-0.5">{user?.rank} · {language === 'kn' ? 'ಬ್ಯಾಡ್ಜ್ ' + user?.badgeNumber : 'Badge ' + user?.badgeNumber}</div>
                    </div>
                    <Link to="/workspace" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      <User size={14} /> {language === 'kn' ? 'ಅಧಿಕಾರಿ ವರ್ಕ್‌ಸ್ಪೇಸ್' : 'Officer Workspace'}
                    </Link>
                    <Link to="/settings" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
                      <Settings size={14} /> {language === 'kn' ? 'ಸೆಟ್ಟಿಂಗ್ಗಳು' : 'Settings'}
                    </Link>
                    <div className="border-t border-[#1F2D40]" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors">
                      <LogOut size={14} /> {language === 'kn' ? 'ಸೈನ್ ಔಟ್' : 'Sign Out'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>"""

# Replace all occurrences of profile block or just find it.
# We can do standard string replacement or regex replacement.
# Let's inspect content first. Let's make sure the replacement works by matching the start and end of the block.
start_marker = '{/* Profile */}'
# Find the next header end </header> or similar, we can find the section and replace it.

start_idx = content.find(start_marker)
if start_idx != -1:
    # Find the next 2 AnimatePresence ends or close to header end
    # Let's search from start_idx for the end of the profile div.
    # Looking at the code:
    # </AnimatePresence>
    # </div>
    # </div>
    # </header>
    end_idx = content.find('</header>', start_idx)
    if end_idx != -1:
        # Find the last </div> before </header> inside that section.
        # Let's trace back from </header> to find the closing div of the profile wrapper.
        # The section looks like:
        #            </div> (profile wrapper)
        #          </div> (header items wrapper)
        #        </header>
        # So we can search backwards from </header> for the second/third </div>.
        # Alternatively, we can just replace everything from {/* Profile */} to the start of {/* ── Page content ── */} or </header>
        header_end_idx = content.find('</header>', start_idx)
        # Let's rebuild the header end part:
        # we have:
        #       {/* Profile */}
        #       ... (our new replacement)
        #       </div>
        #     </header>
        # Wait, the structure in the original file is:
        #           <div className="flex items-center gap-1 ml-auto">
        #             ...
        #             {/* Profile */}
        #             <div className="relative">
        #                ...
        #             </div>
        #           </div>
        #         </header>
        # So it is:
        #               </AnimatePresence>
        #             </div>  <-- profile wrapper
        #           </div> <-- flex items wrapper
        #         </header>
        # Let's see: we want to replace from start_idx up to the first </div> before </div>\n          </div>\n        </header>
        # Actually, let's just replace from `{/* Profile */}` up to `</div>\n          </div>\n        </header>`.
        target_str = content[start_idx:header_end_idx]
        # Let's check how many </div> we have at the end of target_str.
        # We want to replace it up to the end of Profile relative div.
        # So the replacement will fit perfectly.
        # Let's define the new block:
        new_block = replacement + "\n          </div>\n        "
        new_content = content[:start_idx] + new_block + content[header_end_idx:]
        
        # Also clean up replacement characters like  to keep it neat
        # e.g., the  in other parts if they got corrupted.
        # Let's write the file out in clean UTF-8
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("Successfully fixed AppShell.tsx!")
    else:
        print("Could not find </header>")
else:
    print("Could not find {/* Profile */}")
