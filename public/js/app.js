jQuery(function($) {

	Vue.component('editable', {
		data: function() {
			return {
				editing: false,
				savedValue: ''
			}
		},
		props: ['value', 'hide-trash'],
		template: `
			<div class="editable" v-bind:class="{ editing: editing }">
				<div 
					v-if="!editing" 
					v-on:mousedown="edit" 
					class="value">{{value}}</div>
				<div 
					v-if="editing" 
					class="input">
					<input 
						ref="input"
						v-bind:value="value" 
						v-on:input="changed"
						v-on:keyup.enter="done"
						v-on:keyup.esc="done"
					>
					<span uk-icon="trash"
						v-if="!hideTrash" 
						v-on:click="trash"></span>
				</div>
			</div>
		`,
		methods: {
			edit: function(event) {
				console.log('edit', this.editing);
				var that = this;
				this.editing = true;
				setTimeout(function() {
					that.$refs.input.focus();
				}, 100);
			},
			done: function(event) {
				if (this.editing === true && this._props.value !== '') {
					this.editing = false;
					this.$emit('update:value', this._props.value);
				}
			},
			changed: function(event) {
				this.$emit('input', event.target.value);
			},
			trash: function(event) {
				if (this.editing === true) {
					this.editing = false;
					this.$emit('update:trash');
				}
			}
		}
	});



	if ($('#items').length > 0) {

		var items = new Vue({
			el: '#items',
			data: {
				item: {
					title: 'New item...'
				},
				items: [],
				serialized: ''
			},
			methods: {
				create: function(event) {
					var that = this;
					$.post(window.location.href + '/i', this.item, function() {
						that.item.title = 'New item...';
						that.sync();
					});
				},
				sync: function() {
					var that = this;

					$.get(window.location.href + '/i', function(items) {
						that.items = items;
					});
				},
				update: function(id, key, value) {
					if (value === false) {
						this.delete(id);
						return;
					}
					console.log('updating', id, key, value);
					var data = {};
					data[key] = value;
					$.ajax({
						url: window.location.href + '/i/' + id,
						data,
						type: 'put'
					});
				},
				trash: function(id) {
					console.log('deleting', id);
					var that = this;
					$.ajax({
						url: window.location.href + '/i/' + id,
						type: 'delete',
						success: function() {
							that.sync();
						}
					});
				},
				initNestable: function() {
					var that = this;

					var $dd = $('#items .dd');
					
					$dd.nestable({
						maxDepth: 10,
						group: 0
					});

					$dd.on('change', function() {
						console.log('changed');
						var serialized = $dd.nestable('serialize');
						that.serialized = serialized;
					});

					$dd.nestable('rebuild', that.serialized);		

					that.serialized = $dd.nestable('serialize');

				}
			},
			mounted: function() {
				var that = this;
				this.sync();
				this.initNestable();
			}
		});
	}





});