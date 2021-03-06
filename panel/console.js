(() => {
  'use strict';

  Editor.polymerPanel('console', {
    properties: {
      logs: {
        type: Array,
        value () {
          return [];
        },
      },

      filterOption: {
        type: String,
        value: 'All',
      },

      filterText: {
        type: String,
        value: '',
      },

      useRegex: {
        type: Boolean,
        value: false,
      },

      collapse: {
        type: Boolean,
        value: true,
      },

      logsCount: {
        type: Number,
        value: 0,
      },
    },

    ready () {
      Editor.Ipc.sendToMain( 'editor:console-query', (err,results) => {
        for ( let i = 0; i < results.length; ++i ) {
          let item = results[i];
          this.add( item.type, item.message );
        }
      });
    },

    messages: {
      'editor:console-log' ( event, message ) {
        this.add( 'log', message );
      },

      'editor:console-success' ( event, message ) {
        this.add( 'success', message );
      },

      'editor:console-failed' ( event, message ) {
        this.add( 'failed', message );
      },

      'editor:console-info' ( event, message ) {
        this.add( 'info', message );
      },

      'editor:console-warn' ( event, message ) {
        this.add( 'warn', message );
      },

      'editor:console-error' ( event, message ) {
        this.add( 'error', message );
      },

      'editor:console-clear' () {
        this._clear();
      },
    },

    add ( type, text ) {
      let desc = text.split('\n')[0];
      let detail = '';
      let firstLine = text.indexOf('\n');

      if (firstLine > 0) {
        detail = text.substring(firstLine + 1);
      }

      this.push('logs', {
        type: type,
        text: text,
        desc: desc,
        detail: detail,
        count: 0,
      });
      this.logsCount = this.logs.length;

      // to make sure after layout and before render
      if ( !this._scrollTaskID ) {
        this._scrollTaskID = window.requestAnimationFrame (() => {
          this._scrollTaskID = null;
          this.$.view.scrollTop = this.$.view.scrollHeight;
        });
      }
    },

    clear () {
      this._clear();
      Editor.Ipc.sendToMain('console:clear');
    },

    _clear () {
      this.logs = [];
      this.logsCount = this.logs.length;
    },

    _onOpenLogFile () {
      Editor.Ipc.sendToPackage( 'console', 'open-log-file' );
    },

    applyFilter ( logsCount, filterText, filterOption, useRegex, collapse ) {
      let filterLogs = [];
      let type = filterOption.toLowerCase();

      let filter;
      if ( useRegex ) {
        try {
          filter = new RegExp(filterText);
        } catch ( err ) {
          filter = new RegExp('');
        }
      } else {
        filter = filterText.toLowerCase();
      }

      let log = null;

      for ( let i = 0; i < this.logs.length; ++i ) {
        let log_ = this.logs[i];

        log = {
          type: log_.type,
          text: log_.text,
          desc: log_.desc,
          detail: log_.detail,
          count: 0,
        };

        if ( type !== 'all' && log.type !== type ) {
          continue;
        }

        if ( useRegex ) {
          if ( !filter.exec(log.text) ) {
            continue;
          }
        } else {
          if ( log.text.toLowerCase().indexOf(filter) === -1 ) {
            continue;
          }
        }

        filterLogs.push(log);
      }


      if ( collapse && filterLogs.length > 0 ) {
        let collapseLogs = [];
        let lastLog = filterLogs[0];

        collapseLogs.push( lastLog );

        for ( let i = 1; i < filterLogs.length; ++i ) {
          log = filterLogs[i];

          if ( lastLog.text === log.text && lastLog.type === log.type ) {
            lastLog.count += 1;
          } else {
            collapseLogs.push( log );
            lastLog = log;
          }
        }

        filterLogs = collapseLogs;
      }

      return filterLogs;
    },
  });

})();
