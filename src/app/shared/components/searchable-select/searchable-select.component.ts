import { Component, Input, Output, EventEmitter, signal, computed, ElementRef, HostListener, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export interface SelectOption {
  value: string;
  labelAr: string;
  labelEn: string;
}

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-select.component.html',
  styleUrl: './searchable-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true
    }
  ]
})
export class SearchableSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = '';
  @Input() lang: string = 'ar';

  isOpen = signal(false);
  searchText = signal('');
  selectedValue = signal<string>('');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  filteredOptions = computed(() => {
    const term = this.searchText().toLowerCase();
    if (!term) return this.options;
    return this.options.filter(o =>
      o.labelAr.toLowerCase().includes(term) ||
      o.labelEn.toLowerCase().includes(term) ||
      o.value.toLowerCase().includes(term)
    );
  });

  selectedLabel = computed(() => {
    const val = this.selectedValue();
    if (!val) return '';
    const opt = this.options.find(o => o.value === val);
    if (!opt) return val;
    return this.lang === 'ar' ? opt.labelAr : opt.labelEn;
  });

  constructor(private elRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleDropdown(): void {
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.searchText.set('');
    }
  }

  selectOption(option: SelectOption): void {
    this.selectedValue.set(option.value);
    this.isOpen.set(false);
    this.searchText.set('');
    this.onChange(option.value);
    this.onTouched();
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.selectedValue.set('');
    this.onChange('');
    this.onTouched();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchText.set(input.value);
  }

  // ControlValueAccessor
  writeValue(value: string): void {
    this.selectedValue.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
